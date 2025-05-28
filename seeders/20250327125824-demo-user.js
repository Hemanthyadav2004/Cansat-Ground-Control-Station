module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      INSERT INTO "Users" (id, username, email, password, role, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), 'admin', 'admin@example.com', 'hashedpassword123', 'admin', NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE username = 'admin');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Users", { username: "admin" });
  },
};
