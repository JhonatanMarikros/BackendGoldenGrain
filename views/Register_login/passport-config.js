// passport-config.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email); // Gunakan await di sini untuk menunggu hasil pencarian pengguna
        if (!user) {
            return done(null, false, { message: 'Email not Registered' });
        }   
        try {
            // Cek apakah user dan password yang diterima adalah string yang valid
            console.log('Received password:', password);
            console.log('User password from DB:', user.password);

            // Pastikan password yang diberikan tidak kosong
            if (!password) {
                return done(null, false, { message: 'Password not provided' });
            }

            // Bandingkan password yang diterima dengan password yang di-hash dari database
            const isPasswordMatch = await bcrypt.compare(password, user.password);
            if (isPasswordMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password Incorrect' });
            }
        } catch (e) {
            return done(e);
        }
    };

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const user = await getUserById(id);
        return done(null, user);
    });
}

module.exports = initialize;
