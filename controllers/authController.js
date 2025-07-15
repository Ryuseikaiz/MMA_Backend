const User = require('../models/User');
const Token = require('../models/Token');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

exports.register = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await new User({ fullName, email, password: hashedPassword }).save();

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await new Token({ userId: user._id, token: verificationToken }).save();
        
        const verificationUrl = `myproductapp://verify-email/${verificationToken}`;
        const htmlMessage = `<h1>Email Verification</h1><p>Please tap the button below to verify your email:</p><a href="${verificationUrl}" style="background-color:#6200ee;color:white;padding:14px 25px;text-align:center;text-decoration:none;display:inline-block;">Verify Email</a>`;
        await sendEmail(user.email, 'Verify Your Email', htmlMessage);

        res.status(201).json({ msg: 'Registration successful. Please check your email to verify.' });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.verifyMobileToken = async (req, res) => {
    try {
        const { token } = req.body;
        const tokenDoc = await Token.findOne({ token });
        if (!tokenDoc) return res.status(400).json({ msg: 'Invalid or expired verification link.' });
        
        const user = await User.findById(tokenDoc.userId);
        if (!user) return res.status(400).json({ msg: 'User not found.' });

        user.status = 'verified';
        await user.save();
        await tokenDoc.deleteOne();
        res.status(200).json({ msg: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ msg: 'Invalid Credentials' });
        
        if (user.status === 'unverified') {
            return res.status(403).json({ msg: 'Please verify your email before logging in.', errorCode: 'ACCOUNT_NOT_VERIFIED' });
        }
        
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        
        const payload = { user: { id: user.id } };
        const appToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        res.json({ token: appToken, user: { id: user.id, fullName: user.fullName, email: user.email } });
    } catch (err) {
        res.status(500).send('Server error');
    }
};

exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: [
                process.env.GOOGLE_WEB_CLIENT_ID,
                process.env.GOOGLE_ANDROID_CLIENT_ID,
                process.env.GOOGLE_IOS_CLIENT_ID,
            ],
        });
        const { name, email, email_verified } = ticket.getPayload();

        if (!email_verified) return res.status(400).json({ msg: 'Google email is not verified.' });

        let user = await User.findOne({ email });
        if (!user) {
            user = await new User({ fullName: name, email, status: 'verified' }).save();
        }

        const payload = { user: { id: user.id } };
        const appToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
        res.json({ token: appToken, user: { id: user.id, fullName: user.fullName, email: user.email } });
    } catch (error) {
        res.status(500).json({ msg: 'Google authentication failed' });
    }
};