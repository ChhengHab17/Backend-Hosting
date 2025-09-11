import Quiz from "../models/quizModel.js";
import QuizAttempt from "../models/quizAttemptModel.js";

// CREATE quiz with questions and options
export const createQuiz = async (req, res) => {
  try {
    const { course_id, title, description, questions } = req.body;

    if (!course_id || !title) {
      return res.status(400).json({ message: "Course ID and title are required" });
    }

    // Check if a quiz already exists for the given course ID
    const existingQuiz = await Quiz.findOne({ course_id });
    if (existingQuiz) {
      return res.status(400).json({ message: "A quiz for this course already exists." });
    }

    // Apply question-type rules
    const processedQuestions = questions.map((q) => {
      if (q.question_type === "single") {
        if (!q.options || q.options.length !== 4) {
          throw new Error("Single choice questions must have exactly 4 options");
        }
      } else if (q.question_type === "truefalse") {
        if (!q.options || q.options.length !== 2) {
          throw new Error("True/False questions must have exactly 2 options");
        }
      } else if (q.question_type === "multiple") {
        if (!q.options || q.options.length < 4) {
          throw new Error("Multiple choice questions must have at least 4 options");
        }
      }
      return q;
    });

    const newQuiz = new Quiz({
      course_id,
      title,
      description,
      questions: processedQuestions,
    });

    await newQuiz.save();
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// UPDATE quiz (title, description, questions, options)
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (title) quiz.title = title;
    if (description) quiz.description = description;

    if (questions) {
      const processedQuestions = questions.map((q) => {
        if (q.question_type === "single") {
          if (!q.options || q.options.length !== 4) {
            throw new Error("Single choice questions must have exactly 4 options");
          }
        } else if (q.question_type === "truefalse") {
          if (!q.options || q.options.length !== 2) {
            throw new Error("True/False questions must have exactly 2 options");
          }
        } else if (q.question_type === "multiple") {
          if (!q.options || q.options.length < 4) {
            throw new Error("Multiple choice questions must have at least 4 options");
          }
        }
        return q;
      });

      quiz.questions = processedQuestions;
    }

    const updatedQuiz = await quiz.save();
    res.status(200).json(updatedQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE quiz by ID
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params; // <-- fix here
    const deletedQuiz = await Quiz.findByIdAndDelete(id);

    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting quiz", error: err.message });
  }
};

// Delete a question by its _id
export const deleteQuizQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Remove question by _id
    quiz.questions = quiz.questions.filter(q => q._id.toString() !== questionId);
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete an option by its _id from a question
export const deleteQuizOption = async (req, res) => {
  try {
    const { id, questionId, optionId } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const question = quiz.questions.id(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // Remove option by _id
    question.options = question.options.filter(opt => opt._id.toString() !== optionId);
    await quiz.save();
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get quiz by ID
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("course_id");
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get quiz by course ID
export const getQuizByCourseId = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ course_id: req.params.courseId });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Submit quiz (basic evaluation)
export const submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers, user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const quiz = await Quiz.findOne({ course_id: courseId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    const processedAnswers = [];

    quiz.questions.forEach((q, qi) => {
      const userAnswer = answers.find(a => a.questionIndex === qi);
      if (!userAnswer) return;

      const correctIndexes = q.options
        .map((opt, idx) => (opt.isCorrect ? idx : null))
        .filter(idx => idx !== null);

      const isCorrect =
        correctIndexes.length === userAnswer.selectedOptions.length &&
        correctIndexes.every(idx => userAnswer.selectedOptions.includes(idx));

      if (isCorrect) score++;

      processedAnswers.push({
        question_index: qi,
        selected_options: userAnswer.selectedOptions,
        correct_options: correctIndexes,
        is_correct: isCorrect
      });
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= 70; // 70% passing grade

    // Check if user already has an attempt for this course
    let quizAttempt = await QuizAttempt.findOne({ 
      user_id, 
      course_id: courseId 
    });

    if (quizAttempt) {
      // Update existing attempt and track highest score
      quizAttempt.score = score;
      quizAttempt.total_questions = quiz.questions.length;
      quizAttempt.percentage = percentage;
      quizAttempt.passed = passed;
      quizAttempt.answers = processedAnswers;
      quizAttempt.attempt_number = quizAttempt.attempt_number + 1;
      
      // Update highest score if current score is better
      if (percentage > quizAttempt.highest_percentage) {
        quizAttempt.highest_score = score;
        quizAttempt.highest_percentage = percentage;
        quizAttempt.highest_passed = passed;
      }
      
      await quizAttempt.save();
    } else {
      // Create new attempt (first time)
      quizAttempt = new QuizAttempt({
        user_id,
        quiz_id: quiz._id,
        course_id: courseId,
        score,
        total_questions: quiz.questions.length,
        percentage,
        passed,
        answers: processedAnswers,
        attempt_number: 1,
        highest_score: score,
        highest_percentage: percentage,
        highest_passed: passed
      });
      await quizAttempt.save();
    }

    res.json({ 
      total: quiz.questions.length, 
      score, 
      percentage,
      passed,
      attempt_number: quizAttempt.attempt_number,
      quiz_attempt_id: quizAttempt._id
    });
  } catch (err) {
    res.status(500).json({ message: "Error submitting quiz", error: err.message });
  }
};

// Get user's quiz attempts for a course (now returns single attempt per course)
export const getUserQuizAttempts = async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    const attempt = await QuizAttempt
      .findOne({ user_id: userId, course_id: courseId })
      .populate('quiz_id', 'title description');

    if (!attempt) {
      return res.json([]);
    }

    res.json([attempt]); // Return as array for compatibility
  } catch (err) {
    res.status(500).json({ message: "Error fetching quiz attempts", error: err.message });
  }
};

// Get user's latest quiz attempt for a course (now same as single attempt)
export const getUserLatestQuizAttempt = async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    const attempt = await QuizAttempt
      .findOne({ user_id: userId, course_id: courseId })
      .populate('quiz_id', 'title description');

    if (!attempt) {
      return res.status(404).json({ message: "No quiz attempts found" });
    }

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest quiz attempt", error: err.message });
  }
};

// Check if user has completed quiz for a course
export const checkQuizCompletion = async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    const quiz = await Quiz.findOne({ course_id: courseId });
    if (!quiz) {
      return res.json({ hasQuiz: false, completed: false });
    }

    // Get the single attempt for this user and course
    const attempt = await QuizAttempt
      .findOne({ user_id: userId, course_id: courseId });

    res.json({
      hasQuiz: true,
      completed: !!attempt,
      passed: attempt?.highest_passed || false,
      score: attempt?.highest_score || 0,
      percentage: attempt?.highest_percentage || 0,
      total_questions: quiz.questions.length,
      attempt_number: attempt?.attempt_number || 0,
      last_attempt_date: attempt?.updatedAt || null,
      // Also include current/latest attempt data
      latest_score: attempt?.score || 0,
      latest_percentage: attempt?.percentage || 0,
      latest_passed: attempt?.passed || false
    });
  } catch (err) {
    res.status(500).json({ message: "Error checking quiz completion", error: err.message });
  }
};