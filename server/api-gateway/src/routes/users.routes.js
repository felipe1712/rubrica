const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middlewares/auth');
const usersCtrl = require('../controllers/users.controller');

router.use(authenticateUser);

router.get('/',       usersCtrl.listUsers);
router.post('/',      usersCtrl.createUser);
router.put('/:id',    usersCtrl.updateUser);
router.delete('/:id', usersCtrl.deleteUser);

module.exports = router;
