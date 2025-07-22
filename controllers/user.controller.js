import { jwtVerify } from "../middleware/auth.middleware.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloudinary.js";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong!");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  if (!req.body || Object.keys(req.body).length == 0) {
    throw new ApiError(400, "Request body is empty or missing");
  }

  const { fullName, password, email, confirmPassword, phoneNumber } = req.body;
  if (
    [fullName, password, email, confirmPassword, phoneNumber].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "the confirm password is incorrect");
  }
  const existedUser = await User.findOne({
    $or: [{ phoneNumber }, { email }],
  });
  if (existedUser) {
    throw new ApiError(
      400,
      "the user is already existed with your email or number"
    );
  }

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files?.avatar[0].path;
  }

  const avatar = await uploadCloudinary(avatarLocalPath);

  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    email,
    password,
    phoneNumber,
  });
  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something when wrong while registring  the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, phoneNumber,password ,latitude, longitude } = req.body;
  // console.log(phoneNumber);
  if (!email && !phoneNumber) {
    throw new ApiError(400, "phoneNumber or email is required");
  }
  const user = await User.findOne({
    $or: [
      {email},
      {phoneNumber},
    ],
  });
  if (!user) {
    throw new ApiError(404, "user does not existed");
  }
  const isPasswordVaild = await user.isPasswordCorrect(password);
  if (!isPasswordVaild) {
    throw new ApiError(401, "Incorrect password please try again!");
  }
  

  const { refreshToken, accessToken } = await generateAccessRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );
   if(typeof longitude =="number" && typeof latitude== "number" && longitude>= -180 && longitude<=180 &&latitude >= -90 && latitude <= 90){
    await User.findByIdAndUpdate(user?._id,{
      location:{
        type:"Point",
        coordinates:[req.body.longitude, req.body.latitude]
      }
    })
   }
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200,
        {
        user: loggedInUser,
        refreshToken,
        accessToken,
        }
      ,"The user is successfully logged In")
    );
});


const logoutUser = asyncHandler(async(req,res)=>{
  await  User.findByIdAndUpdate(req.user?._id,{

     $unset:{
        refreshToken:1,
     }
  })
  return res
  .status(200)
  .clearCookie("refreshToken",options)
  .clearCookie("accessToken",options)
  .json(new ApiResponse(200,{},"User has been logged out"))
})

const refreshAccessToken= asyncHandler(async(req,res)=>{
  const incomingRefreshToken=
  req.cookies.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }
  try {
    const decodedToken= jwtVerify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     );
     const user= await User.findById(decodedToken?._id);
     if(!user){
      throw new ApiError(401,"Invalid Refresh Token")
     }
     if(incomingRefreshToken!== user?.refreshToken){
      throw new ApiError(401,"refresh Token is expired or used");
     }
     const {refreshToken,accessToken}= await generateAccessRefreshToken(
      user._id
     )
    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(200,
      {
        accessToken,newRefreshToken: refreshToken
      },
      "Tokens is  refreshed successfully"
    ))
  } catch (error) {
    console.error("Refresh Token Error:", error);
    throw new ApiError(401,"Token is not refreshed successfully")
  }
});
export { registerUser ,loginUser,logoutUser,refreshAccessToken};
