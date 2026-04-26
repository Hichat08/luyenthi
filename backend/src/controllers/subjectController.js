import Subject from "../models/Subject.js";

const defaultSubjectNames = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Tin học",
  "Công nghệ",
  "Giáo dục kinh tế và pháp luật",
];

const normalizeSubjectName = (value) =>
  `${value ?? ""}`
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export const getSubjects = async (_req, res) => {
  try {
    const customSubjects = await Subject.find()
      .sort({ name: 1 })
      .select("name normalizedName");

    const mergedSubjects = new Map();

    defaultSubjectNames.forEach((name) => {
      mergedSubjects.set(normalizeSubjectName(name), { name });
    });

    customSubjects.forEach((subject) => {
      mergedSubjects.set(subject.normalizedName, { name: subject.name });
    });

    return res.status(200).json({
      subjects: Array.from(mergedSubjects.values()),
    });
  } catch (error) {
    console.error("Lỗi khi getSubjects", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const createSubject = async (req, res) => {
  try {
    const name = `${req.body?.name ?? ""}`.trim().replace(/\s+/g, " ");
    const normalizedName = normalizeSubjectName(name);

    if (!name) {
      return res.status(400).json({ message: "Tên môn học không được để trống." });
    }

    const existingDefault = defaultSubjectNames.find(
      (subjectName) => normalizeSubjectName(subjectName) === normalizedName
    );

    if (existingDefault) {
      return res.status(200).json({
        subject: { name: existingDefault },
      });
    }

    const existingSubject = await Subject.findOne({ normalizedName }).select("name");

    if (existingSubject) {
      return res.status(200).json({
        subject: { name: existingSubject.name },
      });
    }

    const subject = await Subject.create({
      name,
      normalizedName,
      createdBy: req.user?._id ?? null,
    });

    return res.status(201).json({
      subject: { name: subject.name },
    });
  } catch (error) {
    console.error("Lỗi khi createSubject", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
