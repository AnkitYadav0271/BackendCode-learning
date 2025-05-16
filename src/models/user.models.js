
import mongoose ,{Schema} from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
    id: {
        type:String,
        
        unique:true,

    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video",
        required:true,
    }],
    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true,
        trim:true,

    },
    fullName:{
        type:String,
        require:true
    },
    email : {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    }
    ,
    avatar:{
     type:String, //cloudinary url
    }
    ,
    coverImage : {
        type:String  //cloudinary url
    },
    password:{
        type:String,
        required:true,

    },
    createdAt:{
        type:Date,
       

    },
    updatedAt:{
        type:Date,
      
    },
    refreshTokens:{
        type:String,
    },
    accessToken:{
        type: String,
    }

});
userSchema.pre("save",async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
})
userSchema.methods.isPasswordCorrect = async function (password){
 return await  bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken = function (){
   return jwt.sign(
        //*the below line is for payload
        {
        _id:this.id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
)
};


userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        //*the below line is for payload
        {
        _id:this.id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn : process.env.REFRESH_TOKEN__EXPIRY
    }
)
};
export const User = mongoose.model("User",userSchema);