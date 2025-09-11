import Video from "../models/videoModel.js";

// create video
export const createVideo = async (req, res) => {
  try {
    const { course_id, lesson_id, title, description, url } = req.body;

    // Validate required fields
    if (!course_id || !lesson_id || !url) {
      return res.status(400).json({
        success: false,
        message: "Course ID, lesson ID, and URL are required fields"
      });
    }

    const newVideo = new Video({
      course_id,
      lesson_id,
      title,
      description,
      url
    });

    await newVideo.save();

    res.status(201).json({
      success: true,
      data: newVideo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// update video
export const updateVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id, lesson_id, title, description, url } = req.body;

        const video = await Video.findById(id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        video.course_id = course_id || video.course_id;
        video.lesson_id = lesson_id || video.lesson_id;
        video.title = title || video.title;
        video.description = description || video.description;
        video.url = url || video.url;

        await video.save();

        res.status(200).json({
            success: true,
            data: video
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// delete video
export const deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await Video.findByIdAndDelete(id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Video deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// get video by id
export const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;

        const video = await Video.findById(id)
            .populate('course_id', 'course_title')
            .populate('lesson_id', 'title');

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        res.status(200).json({
            success: true,
            data: video
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// get video by lesson id
export const getVideoByLessonId = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const videos = await Video.find({ lesson_id: lessonId })
            .populate('course_id', 'course_title')
            .populate('lesson_id', 'title');

        res.status(200).json({
            success: true,
            data: videos,
            count: videos.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// get videos by course id
export const getVideosByCourseId = async (req, res) => {
    try {
        const { courseId } = req.params;

        const videos = await Video.find({ course_id: courseId })
            .populate('course_id', 'course_title')
            .populate('lesson_id', 'title');

        res.status(200).json({
            success: true,
            data: videos,
            count: videos.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// get all videos
export const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find()
            .populate('course_id', 'course_title')
            .populate('lesson_id', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: videos,
            count: videos.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};