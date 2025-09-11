import Lesson from "../models/lessonModel.js";

// Create a new lesson
export const createLesson = async (req, res) => {
    try {
        const { course_id, title, sub_title, content, image } = req.body;
        if (!course_id || !title || !content ) {
            return res.status(400).json({ message: "Course ID, title, and content are required" });
        }
        const newLesson = new Lesson({ course_id, title, sub_title, content, image });
        await newLesson.save();
        res.status(201).json(newLesson);
    } catch (error) {
        res.status(500).json({ message: "Error creating lesson", error: error.message });
    }
};

// Update an existing lesson
export const updateLesson = async (req, res) => {
    try {
        const { course_id, title, sub_title, content, image } = req.body;
        const updatedLesson = await Lesson.findByIdAndUpdate(
            req.params.id,
            { course_id, title, sub_title, content, image },
            { new: true, runValidators: true }
        );
        if (!updatedLesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        res.status(200).json(updatedLesson);
    } catch (error) {
        res.status(500).json({ message: "Error updating lesson", error: error.message });
    }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
    try {
        const deletedLesson = await Lesson.findByIdAndDelete(req.params.id);
        if (!deletedLesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error deleting lesson", error: error.message });
    }
};

// Get a lesson by ID
export const getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }
        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ message: "Error fetching lesson", error: error.message });
    }
};

// Get all lessons
export const getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find();
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ message: "Error fetching lessons", error: error.message });
    }
};

