require("../bootstrap");

module.exports = {
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  dialect: process.env.DB_DIALECT || "mysql",
  timezone: "-03:00",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  logging: false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),
    min: parseInt(process.env.DB_POOL_MIN || "5", 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
    idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
    evict: parseInt(process.env.DB_POOL_EVICT || "1000", 10)
  },
  dialectOptions: {
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10),
    supportBigNumbers: true,
    bigNumberStrings: true
  },
  retry: {
    max: 3,
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ]
  }
};
