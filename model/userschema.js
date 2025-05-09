// const {createHmac,randomBytes}=require('node:crypto');
// const {Schema,model}=require('mongoose');
// const {createTokenForUser}=require('../services/authentication')
// const bcrypt = require('bcrypt');
// const userSchema=new Schema({
//     FirstName:{
//         type:String,
//         required:true,
//     },
//     LastName:{
//         type:String,
//         required:true,
//     },
//     email:{
//         type:String,
//         required:true,
//         unique:true,
//     },
//     salt:{
        
//         type:String,
        
        
//     },
//     password:{
//         type:String,
//         required:true,
//     },
    
//     role:{
//         type:String,
//         enum:["USER","ADMIN"],
//         default:"USER",
//     },

    
// },{timestamps:true});
 //taken from mongoose pre save example
//  userSchema.pre("save", async function (next) {
//     const user = this;
//     if (!user.isModified("password")) return next();
//     const saltRounds = 10;
//     const salt = await bcrypt.genSalt(saltRounds);
//     const hashedPassword = await bcrypt.hash(user.password, salt);
//     user.salt = salt;
//     user.password = hashedPassword;
//     console.log("hashed password at signup:", hashedPassword);
//     next();
// });


// userSchema.static("matchPasswordAndGenerateToken", async function (email, password) {
//     const user = await this.findOne({ email });

//     if (!user) throw new Error('User not found!');

//     // Compare the entered password with the stored bcrypt hash
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     console.log("Signup - Raw Password:", password);
//     console.log("Signup - Hashed Password:", hashedPassword);


//     if (!isPasswordValid) throw new Error("Incorrect Password");

//     // Generate token if password is valid
//     const token = createTokenForUser(user);
//     return token;
// });

// const User=model('user',userSchema);

// module.exports=User;
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose; //  Fix: Import Schema

const userSchema = new Schema({
    idNumber: {
        type: String,
        required: true,
        unique: true, // Ensure unique ID numbers
        lowercase: true, //  Store in lowercase for case-insensitive search
    },
    password: {
        type: String,
        required: true,
    },
    FirstName: { // Add FirstName field
        type: String,
        required: true, // Optional: make it required if needed
    },
    email: { // Add email field
        type: String,
        required: true,
        unique: true, // Ensure emails are unique
        lowercase: true, // Store in lowercase for case-insensitive search
    },
    role: {
        type: String,
        enum: ["USER", "ADMIN"],
        default: "USER",
    },
    
}, { timestamps: true });

// Hash password before saving (if modified)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.password.startsWith("$2b$")) {
        return next(); // ✅ Prevent double hashing
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//  Method to compare password
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// 🔹 Method to update password
userSchema.methods.updatePassword = async function (newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    this.password = hashedPassword; 
    await this.save();
};

const User = mongoose.model("User", userSchema);
module.exports = User;
