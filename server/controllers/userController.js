import userModel from "../models/userModels.js";


export const getUserData = async (req, res) => {
  try {
    const userId = req.userId; 

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      userData: {
        userId: user._id,
        name: user.name,
        isAccountVerified: user.isAccountVerified,
      }
    });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};
