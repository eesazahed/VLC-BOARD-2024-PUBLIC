const crypto = require("crypto");

const encrypt = (text) => {
  const method = "aes-256-gcm";
  const key = String(process.env.HASH_KEY).slice(0, 32);
  const iv = "02789g3bn092834n09238n409n8";

  const textCipher = crypto.createCipheriv(method, key, iv);

  return textCipher.update(text, "utf8", "hex") + textCipher.final("hex");
};

module.exports = encrypt;
