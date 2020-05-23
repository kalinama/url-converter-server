const {Router} = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const User = require('../models/User');
const router = Router();

// /api/auth/register
router.post(
  '/register',
  [
    check('email', 'Invalid email').isEmail(),
    check('password', 'Minimum password length is 6 characters')
      .isLength({min: 6})
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (errors.array().length === 1) {
        return res.status(400).json({
          message: errors.array()[0].msg
        });
      } else if (errors.array().length === 2) {
        return res.status(400).json({
          message: `${errors.array()[0].msg} & ${errors.array()[1].msg}`
        });
      }
    }

    const {email, password} = req.body;

    const candidate = await User.findOne({ email });

    if (candidate) {
      return res.status(400).json({ message: 'Такой пользователь уже существует' })
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword });

    await user.save();

    res.status(201).json({message: 'Пользователь создан'});
  } catch (e) {
    res.status(500).json({message: 'Что-то пошло не так, попробуйте снова' });
  }
});

// /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Введите корректный Email')
      .normalizeEmail()
      .isEmail(),
    check('password', 'Введите пароль')
      .exists()
  ],
  async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: 'Некорректные данные при входе в систему'
      });
    }

    const {email, password} = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' })
    }
    console.log(password, user.password)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный пароль, попробуйте снова' })
    }
    console.log(isMatch);
    const token = jwt.sign(
      { userId: user.id },
      process.env.jwtSecret,
      { expiresIn: '1h' }
    );
    console.log(token);
    await res.json({token, userId: user.id});//await

  } catch (e) {
    res.status(500).json({message: 'Что-то пошло не так, попробуйте снова' });
  }
});


module.exports = router;