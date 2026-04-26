import api from "@/lib/axios";

export type SubjectCatalogItem = {
  name: string;
};

export const subjectService = {
  getSubjects: async () => {
    const res = await api.get("/subjects", { withCredentials: true });
    return res.data.subjects as SubjectCatalogItem[];
  },
  createSubject: async (name: string) => {
    const res = await api.post(
      "/subjects",
      { name },
      { withCredentials: true }
    );

    return res.data.subject as SubjectCatalogItem;
  },
};
