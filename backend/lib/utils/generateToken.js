import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (userId, res) => {

    //userId와 JWT_SECRET를 인자로 사용하여 token 생성
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: '15d'
    });

    //생성한 token을 res.cookie에 주입
    res.cookie("jwt", token, {
        maxAge: 15*24*60*60*1000,
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", //CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== 'development',
    });
}