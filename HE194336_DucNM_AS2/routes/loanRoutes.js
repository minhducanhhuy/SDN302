const express = require('express');
const loanController = require('../controllers/loanController');

const router = express.Router();

router.get('/', loanController.getAllLoans);
router.get('/member/:memberId', loanController.getLoansByMemberId);
router.get('/:id', loanController.getLoanById);
router.post('/', loanController.createLoan);
router.put('/:id/return', loanController.returnLoan);
router.put('/:id', loanController.updateLoan);
router.patch('/:id', loanController.updateLoan);
router.delete('/:id', loanController.deleteLoan);

module.exports = router;
