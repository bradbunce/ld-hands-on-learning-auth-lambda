const queries = {
  getUserByUsername: `
        SELECT
            user_id,
            username,
            password_hash,
            email,
            city,
            state,
            country_code,
            is_active
        FROM users
        WHERE username = ?
    `,

  getUserByEmail: `
        SELECT
            user_id,
            username,
            email
        FROM users
        WHERE email = ?
    `,

  createUser: `
        INSERT INTO users (
            username,
            email,
            password_hash
        ) VALUES (?, ?, ?)
    `,

  updateLastLogin: `
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `,

  updatePassword: `
        UPDATE users
        SET password_hash = ?
        WHERE user_id = ?
    `,

  createPasswordReset: `
        INSERT INTO password_resets (
            user_id,
            reset_token,
            expires_at
        ) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
    `,

  getPasswordReset: `
        SELECT
            pr.reset_token,
            pr.expires_at,
            u.user_id,
            u.username,
            u.email
        FROM password_resets pr
        JOIN users u ON u.user_id = pr.user_id
        WHERE pr.reset_token = ?
        AND pr.expires_at > NOW()
        AND pr.used = 0
    `,

  getValidPasswordReset: `
        SELECT
            pr.reset_token,
            pr.expires_at,
            u.user_id,
            u.username,
            u.email
        FROM password_resets pr
        JOIN users u ON u.user_id = pr.user_id
        WHERE pr.reset_token = ?
        AND pr.expires_at > ?
        AND pr.used = 0
    `,

  markResetTokenUsed: `
        UPDATE password_resets
        SET used = 1
        WHERE reset_token = ?
    `,

  updateUserPassword: `
        UPDATE users
        SET password_hash = ?
        WHERE user_id = ?
    `,

  getUserById: `
        SELECT user_id, username, email, password_hash, city, state, country_code 
        FROM users 
        WHERE user_id = ?
    `,

  updateUserProfile: `
        UPDATE users 
        SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `,
};

module.exports = { queries };
