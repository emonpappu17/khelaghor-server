export const generateOTP = () => {
    return Number(Math.floor(100000 + Math.random() * 900000).toString());
};