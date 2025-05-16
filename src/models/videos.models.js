import mongoose ,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        id:{
            type:String,
            required:true,
            unique:true,
        },
        videoFile: {
            type:String,  //*cloudinary url
            required:[true,"Choose a valid video File"],
        },
        thumbnail: {
            type:String,
            
        },
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
        },
        duration:{
            type: Number, //cloudinary well send the time
            required:true,
        },
        isPublished: {
            type: Boolean,
        },
        isPublic:{
            type:Boolean,
            default:true,
        },
        createdAt:{
            type:Date,
            required:true
        },
        updatedAt:{
            type:Date,
            required:true
        },
        views:{
            type: Number,
            default:0
        },
        owner:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },{timestamps:true});
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video",videoSchema);    