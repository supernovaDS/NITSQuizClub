import { syncIndexes } from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js";

export const register = async (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.json({success : false, message : 'Missing Details'});
    }

    try{

        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.json({success : false, message : 'User Already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user =  new userModel({name, email, password: hashedPassword});

        await user.save();

        const token = jwt.sign({id : user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

        res.cookie('token' , token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ?
            'none'  : 'strict',
            maxAge : 7 * 24 * 60 * 60 * 1000
        });


        //sending welcome email
        const mailOption = {
            from : process.env.SENDER_EMAIL,
            to : email, 
            subject: 'Wecolme to My website',
            text : `Welcome to my website, ${name}. Your account has been succesfully created`

        }

        await transporter.sendMail(mailOption);

        return res.json({success : true});


    } catch(err) {
        return res.json({success : false, message : err.message})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.json({success : false , message :  "Email or Password cannot be empty"});
    }

    try {

        const user = await userModel.findOne({email});

        if(!user) {
            return res.json({success : false, message : "Email or Password is Invalid"})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.json({success : false, message : "Email or Password is Invalid"})
        }

        const token = jwt.sign({id : user._id}, process.env.JWT_SECRET, {expiresIn : '7d'});

        res.cookie('token' , token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ?
            'none'  : 'strict',
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        return res.json({success : true});

    } catch(err) {
        return res.json({success : false, message : err.message})
    }
}

export const logout = async (req, res) => {
    try{
        res.clearCookie('token' , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ?
            'none'  : 'strict',
        })


        return res.json({success : true, message : "succesfully Logged Out"})
    } catch {
        return res.json({success : false, message : err.message})
    }
}

export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId; // ✅ Use what's set by middleware

    const user = await userModel.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      html : EMAIL_VERIFY_TEMPLATE.replace("{{otp}}" , otp).replace("{{email}}" , user.email)
    };

    await transporter.sendMail(mailOption);

    return res.json({ success: true, message: "Verification OTP sent to email" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};


//verify email using otp
export const verifyEmail = async (req, res) => {
  const { otp } = req.body;
  const userId = req.userId; // ✅ From middleware

  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing details" });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP is expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;

    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};


//check if user is authenticated
export const isAuthenticated = async (req, res) =>{
    try{
        return res.json({success : true});
    } catch(err) {
        return res.json({success : false, message : err.message})
    }
}

//send password reset
export const sendResetOtp = async (req, res) => {
    const {email} = req.body;

    if(!email) {
        return res.json({success : false, message : "email cannot be empty"});
    }

    try{

        const user = await userModel.findOne({email});

        if(!user) {
            return res.json({success : false, message : "User not found"});
        }

        const otp =  String(Math.floor( 100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOption = {
            from : process.env.SENDER_EMAIL,
            to : user.email, 
            subject: 'Password Reset OTP',
            text : `Your OTP for resetting your password is, ${otp}. Use this otp to proceed with resetting your password` ,
            html : PASSWORD_RESET_TEMPLATE.replace("{{otp}}" , otp).replace("{{email}}" , user.email)
        }

        await transporter.sendMail(mailOption);

        return res.json({success : true, message : "OTP sent to your email"});

    } catch(err) {
        return res.json({success : false, message : err.message})
    }
}

//reset user password
export const resetPassword = async(req,res) => {
    const {otp, email, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        return res.json({success : false, message : "Field cannot be blank"});
    }

    try{


        const user = await userModel.findOne({email});
        if(!user) {
            return res.json({success : false, message : "User not found"});
        }

        if(user.resetOtp === "" || user.resetOtp !== otp){
            return res.json({success : false, message : "Invalid OTP"});
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success : false, message : "OTP Expired"});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({success : true, message : "Password changed succesfully"});

    } catch(err) {
        return res.json({success : false, message : err.message})
    }
}