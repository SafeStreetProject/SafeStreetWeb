const {createHmac,randomBytes}=require('node:crypto');
const {Schema,model}=require('mongoose');
const {createTokenForUser}=require('../services/authentication')
const bcrypt = require('bcrypt');
const userSchema=new Schema({
    FirstName:{
        type:String,
        required:true,
    },
    LastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        
        type:String,
        
        
    },
    password:{
        type:String,
        required:true,
    },
    
    role:{
        type:String,
        enum:["USER","ADMIN"],
        default:"USER",
    },

    
},{timestamps:true});
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


userSchema.static("matchPasswordAndGenerateToken", async function (email, password) {
    const user = await this.findOne({ email });

    if (!user) throw new Error('User not found!');

    // Compare the entered password with the stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Signup - Raw Password:", password);
    console.log("Signup - Hashed Password:", hashedPassword);


    if (!isPasswordValid) throw new Error("Incorrect Password");

    // Generate token if password is valid
    const token = createTokenForUser(user);
    return token;
});

const User=model('user',userSchema);

module.exports=User;