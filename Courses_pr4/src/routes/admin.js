const express = require('express');
const router = express.Router();
const { setDegraded, isDegraded } = require('../health');
const { setIssueAccessFail, isIssueAccessFail } = require('../steps');
const { getCompensationLog } = require('../compensation');
const { ProcessStorage } = require('../storage');

const storage = new ProcessStorage();

router.post('/degrade', (req, res) => {
  setDegraded(true);
  res.json({ ok: true, degraded: true });
});

router.post('/recover', (req, res) => {
  setDegraded(false);
  res.json({ ok: true, degraded: false });
});

router.post('/fail/issue/on', (req, res) => {
  setIssueAccessFail(true);
  res.json({ ok: true, issueAccessWillFail: true });
});

router.post('/fail/issue/off', (req, res) => {
  setIssueAccessFail(false);
  res.json({ ok: true, issueAccessWillFail: false });
});

router.get('/state', (req, res) => {
  res.json({
    degraded: isDegraded(),
    issueAccessWillFail: isIssueAccessFail()
  });
});

router.get('/compensation-log', (req, res) => {
  res.json(getCompensationLog());
});

router.get('/processes', (req, res) => {
  res.json(storage.list());
});

module.exports = router;
