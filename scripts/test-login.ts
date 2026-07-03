import bcrypt from "bcryptjs";

const hash = "$2b$10$CZ5A5fOAgYg0BGHXkrbvT.wnUOC4Apzk4FN/m/91zpCDl7CmV3wLm";

bcrypt.compare("password", hash)
  .then(console.log)
  .catch(console.error);
