const {Router} = require('express');
const config = require('config');
const shortid = require('shortid');
const Link = require('../models/Link');
const auth = require('../middleware/auth.middleware');
const router = Router();

router.post('/generate', auth, async (req, res) => {
  try {
    const baseUrl = config.get('baseUrl');
    const { from } = req.body;

    const code = shortid.generate();

    const existing = await Link.findOne({ from });

    if (existing) {
      return await res.json({ link: existing });
    }

    const to = baseUrl + '/t/' + code;

    const link = new Link({
      code, to, from, owner: req.user.userId
    });

    await link.save();

    res.status(201).json({ link });
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' })
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const links = await Link.find({ owner: req.user.userId });
    await res.json(links);
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});

router.get('/top', async (req, res) => {
  try {
    const link = await Link.find();
    await res.json(link);
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    await res.json(link)
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});

router.post('/remove/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, owner: req.user.userId });
    if (link !== null ) {
      await Link.deleteOne({
        _id: req.params.id,
      });
      res.status(201).json({message: 'Ссылка удалена' });
    } else {
      res.status(403).json({ message: 'Вы не явялетесь владельцем данной ссылки' })
    }
  } catch (e) {
    res.status(500).json({ message: 'Что-то пошло не так, попробуйте снова' });
  }
});

module.exports = router;