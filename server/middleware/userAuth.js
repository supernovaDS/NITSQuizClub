import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.json({ success: false, message: "Not Authorized, Login Again." });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.userId = tokenDecode.id; // ✅ FIXED: use req.userId
    } else {
      return res.json({ success: false, message: "Not Authorized, Login Again." });
    }

    next();
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

export default userAuth;
