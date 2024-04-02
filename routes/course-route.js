const { equal } = require('joi');
const { route } = require('./auth');
const { course } = require('../models');

const router = require('express').Router();
const Course = require('../models').course;
const courseValidation = require('../validation').courseValidation;

router.use((req, res, next) => {
  console.log('course route正在接收request');
  next();
});

// 新增課程
router.post('/', async (req, res) => {
  // 驗證數據符合規範
  let { error } = courseValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.user.isStudent()) {
    return res
      .status(400)
      .send('只有講師才能發佈新課程。若你已經是講師，請透過講師帳號登入。');
  }

  let { title, description, price } = req.body;
  try {
    let newCourse = new Course({
      title,
      description,
      price,
      instructor: req.user._id,
    });
    let savedCourse = await newCourse.save();
    return res.send('新課程已經保存');
  } catch (e) {
    return res.status(500).send('無法創建課程。。。');
  }
});

// 獲得系統中的所有課程
router.get('/', async (req, res) => {
  try {
    let findCourse = await Course.find({})
      .populate('instructor', ['username', 'email'])
      .exec();
    return res.send(findCourse);
  } catch (e) {
    return res.status(500).send(e);
  }
});
//用課程id尋找課程
router.get('/:_id', async (req, res) => {
  let { _id } = req.params;
  try {
    let courseFound = await Course.findOne({ _id })
      .populate('instructor', ['email'])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});
//用ID編輯課程
router.patch('/:_id', async (req, res) => {
  let { _id } = req.params;
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send('查無此課程');
    }
    if (courseFound.instructor.equals(req.user._id)) {
      let updateCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      }).exec();
      return res.send({
        msg: '更新成功',
        updateCourse,
      });
    } else {
      return res.status(400).send('只有講師能改');
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

router.delete('/:_id', async (req, res) => {
  let { _id } = req.params;

  try {
    let courseFound = await Course.findOne({ _id }).exec();
    if (!courseFound) {
      return res.status(400).send('查無此課程');
    }
    //使用者必須為講師才能刪除
    if (courseFound.instructor.equals(req.user._id)) {
      await Course.deleteOne({ _id }).exec();
      return res.send('已刪除課程');
    } else {
      return res.status(403).send('只有講師能改');
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用講師ID搜尋課程
router.get('/instructor/:_instructor_id', async (req, res) => {
  let { _instructor_id } = req.params;
  try {
    let findCourse = await Course.find({ instructor: _instructor_id })
      .populate('instructor', ['username', 'email'])
      .exec();
    return res.send(findCourse);
  } catch (e) {
    console.log(e);
  }
});
//用學生ID尋找課程
router.get('/student/:_student_id', async (req, res) => {
  let { _student_id } = req.params;
  try {
    let findCourse = await Course.find({ students: _student_id })
      .populate('instructor', ['username', 'email'])
      .exec();
    return res.send(findCourse);
  } catch (e) {
    console.log(e);
  }
});
//用課程名稱搜尋課程
router.get('/findByName/:name', async (req, res) => {
  try {
    let { name } = req.params;
    let findCourse = await Course.find({ title: name })
      .populate('instructor', ['email', 'username'])
      .exec();
    return res.send(findCourse);
  } catch (error) {
    return res.status(500).send(e);
  }
});

//學生用課程id註冊課程
router.post('/enroll/:_id', async (req, res) => {
  let { _id } = req.params;
  try {
    let course = await Course.findOne({ _id }).exec();
    course.students.push(req.user._id);
    await course.save();
    return res.send('註冊完成');
  } catch (e) {
    return res.status(500).send(e);
  }
});
module.exports = router;
