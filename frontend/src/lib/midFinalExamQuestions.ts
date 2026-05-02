export type MidFinalExamMultipleChoiceQuestion = {
  id: number;
  prompt: string;
  options: string[];
};

export type MidFinalExamTrueFalseQuestion = {
  id: number;
  prompt: string;
  statements: string[];
};

export const midFinalExamMultipleChoiceQuestions: MidFinalExamMultipleChoiceQuestion[] =
  [
    {
      id: 1,
      prompt: "Thuộc tính CSS nào quy định cỡ chữ của phần tử văn bản?",
      options: ["font-style", "font-weight", "font-size", "text-align"],
    },
    {
      id: 2,
      prompt:
        "Để định dạng một phần tử HTML theo lớp (class), trong CSS bạn dùng ký tự nào?",
      options: ["#", ".", "@", "$"],
    },
    {
      id: 3,
      prompt: "Trong CSS, ký hiệu nào biểu thị cho bộ chọn tất cả các phần tử?",
      options: ["#", ".", "*", "%"],
    },
    {
      id: 4,
      prompt:
        "Câu lệnh CSS nào sau đây đúng để thay đổi màu nền cho một phần tử có id là 'menu'?",
      options: [
        ".menu {background-color: red;}",
        "menu {background-color: red;}",
        "#menu {background-color: red;}",
        "$menu {background-color: red;}",
      ],
    },
    {
      id: 5,
      prompt:
        "Trong mô hình hộp CSS, phần nào xác định khoảng cách giữa nội dung và đường viền?",
      options: ["Margin", "Padding", "Border", "Content"],
    },
    {
      id: 6,
      prompt:
        "Thành phần nào trong mô hình hộp điều chỉnh khoảng cách với phần tử bên ngoài?",
      options: ["Padding", "Margin", "Border", "Content"],
    },
    {
      id: 7,
      prompt:
        "Thuộc tính nào được dùng để định dạng kiểu viền như nét liền, nét đứt...?",
      options: ["border-style", "padding", "outline", "margin-style"],
    },
    {
      id: 8,
      prompt: "Học máy (Machine Learning) là gì?",
      options: [
        "Một phương pháp lập trình truyền thống để viết mã cho từng tác vụ cụ thể.",
        "Một lĩnh vực của trí tuệ nhân tạo, giúp máy tính tự học từ dữ liệu mà không cần lập trình rõ ràng.",
        "Một hệ thống điều khiển tự động không liên quan đến trí tuệ nhân tạo.",
        "Một thuật toán chỉ áp dụng trong lĩnh vực toán học và thống kê.",
      ],
    },
    {
      id: 9,
      prompt:
        "Trong các ứng dụng sau, ứng dụng nào KHÔNG phải là ví dụ của Học máy?",
      options: [
        "Nhận dạng tiếng nói và chữ viết.",
        "Lọc thư rác trong hộp thư điện tử.",
        "Soạn thảo văn bản tự động không cần dữ liệu đầu vào.",
        "Hệ thống chẩn đoán bệnh dựa trên hình ảnh y khoa.",
      ],
    },
    {
      id: 10,
      prompt: "Dữ liệu lớn (Big Data) KHÔNG có đặc trưng nào sau đây?",
      options: ["Volume", "Velocity", "Vulnerability", "Variety"],
    },
    {
      id: 11,
      prompt: "Khoa học dữ liệu giúp ích gì cho doanh nghiệp?",
      options: [
        "Thiết kế logo công ty.",
        "Tăng độ bảo mật tài khoản mạng xã hội.",
        "Phân tích hành vi khách hàng để cải thiện dịch vụ.",
        "Giảm giá sản phẩm định kỳ.",
      ],
    },
    {
      id: 12,
      prompt: "Công cụ nào sau đây thường được dùng trong phân tích dữ liệu?",
      options: ["Notepad", "Python", "MS Paint", "Firefox"],
    },
    {
      id: 13,
      prompt: "Dạng dữ liệu nào sau đây KHÔNG phải là dữ liệu lớn?",
      options: [
        "1 file văn bản 10 trang.",
        "Video camera giám sát 24/7.",
        "Lịch sử mua sắm của hàng triệu người dùng.",
        "Hình ảnh avatar cá nhân 300x300 px.",
      ],
    },
    {
      id: 14,
      prompt: "Câu nào sau đây mô tả đúng về đặc điểm của dữ liệu lớn?",
      options: [
        "Lớn về khối lượng, đa dạng, tạo ra nhanh.",
        "Luôn đúng và đáng tin cậy.",
        "Dễ dàng xử lý bằng Excel.",
        "Chủ yếu là văn bản.",
      ],
    },
    {
      id: 15,
      prompt: "Công nghệ nào sau đây giúp xử lý dữ liệu lớn hiệu quả?",
      options: [
        "Máy tính cá nhân.",
        "Ổ cứng di động.",
        "Điện toán đám mây (Cloud Computing).",
        "USB 64GB.",
      ],
    },
    {
      id: 16,
      prompt: "Phát biểu nào sau đây là ĐÚNG về CSS?",
      options: [
        "CSS là ngôn ngữ lập trình.",
        "CSS giúp định dạng cách hiển thị của HTML.",
        "CSS chỉ được dùng trong JavaScript.",
        "CSS không thể dùng cho văn bản.",
      ],
    },
    {
      id: 17,
      prompt: "Cặp thẻ nào sau đây viết SAI cú pháp trong HTML?",
      options: [
        "<html>…</html>",
        "<p>…</p>",
        "<title> Tiêu đề </title>",
        "<body>…</body>",
      ],
    },
    {
      id: 18,
      prompt:
        "Khi cần áp dụng cùng một định dạng cho nhiều phần tử HTML, ta nên dùng?",
      options: ["ID", "Class", "Tag", "Style inline"],
    },
    {
      id: 19,
      prompt: "Để thay đổi cỡ chữ của đoạn văn bản dùng thuộc tính nào?",
      options: ["font-size", "text-align", "background-color", "width"],
    },
    {
      id: 20,
      prompt:
        "Sự khác biệt chính giữa margin và padding trong mô hình hộp là gì?",
      options: [
        "Margin tạo khoảng cách bên trong viền, padding tạo khoảng cách bên ngoài viền",
        "Margin tạo khoảng cách bên ngoài viền, padding tạo khoảng cách bên trong viền",
        "Margin và padding không có sự khác biệt",
        "Margin tạo viền, padding tạo nội dung",
      ],
    },
    {
      id: 21,
      prompt: "Hình ảnh trong trang web nên như thế nào?",
      options: [
        "Phù hợp nội dung và dung lượng tối ưu.",
        "Càng to càng đẹp.",
        "Không cần quan tâm đến tốc độ tải.",
        "Lấy mọi hình trên mạng không cần kiểm tra.",
      ],
    },
    {
      id: 22,
      prompt: "Một trang web báo tường cần kết hợp những yếu tố gì?",
      options: [
        "Văn bản và liên kết",
        "Âm thanh và video",
        "Văn bản, hình ảnh, biểu mẫu",
        "Chỉ ảnh động",
      ],
    },
    {
      id: 23,
      prompt: "Ứng dụng nào là ví dụ điển hình cho trí tuệ nhân tạo?",
      options: [
        "Hệ thống đề xuất phim của Netflix",
        "Trang tính Google Sheets",
        "Trang web giới thiệu sản phẩm tĩnh",
        "Trò chơi xếp hình offline",
      ],
    },
    {
      id: 24,
      prompt:
        "Đặc trưng nổi bật nào giúp nhận biết dữ liệu lớn từ camera giám sát 24/7?",
      options: ["Volume", "Veracity", "Velocity", "Variety"],
    },
    {
      id: 25,
      prompt: "Để liên kết một tập tin CSS bên ngoài, bạn dùng thẻ nào?",
      options: ["<link>", "<style>", "<script>", "<css>"],
    },
    {
      id: 26,
      prompt: "Thành phần nào KHÔNG thuộc mô hình hộp CSS?",
      options: ["Border", "Padding", "Margin", "Grid"],
    },
  ];

export const midFinalExamTrueFalseQuestions: MidFinalExamTrueFalseQuestion[] = [
  {
    id: 1,
    prompt: "An nói với Huy về CSS – Bộ chọn như sau:",
    statements: [
      "Bộ chọn lớp được khai báo bằng dấu chấm.",
      "Bộ chọn định danh được khai báo bằng dấu #.",
      "Bộ chọn lớp và bộ chọn định danh có thể áp dụng cho nhiều phần tử cùng lúc.",
      "Bộ chọn định danh không cần phải bắt đầu bằng dấu hash trong CSS.",
    ],
  },
  {
    id: 2,
    prompt:
      "Khi làm bài tập nhóm về trang web báo tường Huy nói với các bạn trong nhóm về hiển thị phần tử như sau:",
    statements: [
      "h1 và p bắt đầu dòng mới.",
      "img và a hiển thị cùng dòng.",
      "CSS không thể thay đổi kiểu hiển thị.",
      "div thường dùng để bố cục.",
    ],
  },
  {
    id: 3,
    prompt: "Ứng dụng trí tuệ nhân tạo trong giáo dục",
    statements: [
      "Hệ thống học trực tuyến có thể sử dụng AI để cá nhân hóa lộ trình học cho từng học sinh.",
      "AI không thể hỗ trợ chấm bài trắc nghiệm vì không hiểu nội dung.",
      "Ứng dụng AI giúp giáo viên phát hiện học sinh học kém để có kế hoạch hỗ trợ phù hợp.",
      "Hệ thống học trực tuyến dùng AI chỉ có thể hoạt động khi có kết nối Internet.",
    ],
  },
  {
    id: 4,
    prompt: "Thiết kế website cho cửa hàng trực tuyến",
    statements: [
      "Website cần hiển thị đẹp trên cả máy tính và điện thoại (responsive).",
      "Có thể bỏ qua tối ưu tốc độ tải vì mạng bây giờ rất nhanh.",
      "Nên tích hợp chức năng giỏ hàng và thanh toán trực tuyến.",
      "Nên sử dụng hình ảnh sản phẩm chất lượng cao nhưng được nén tối ưu dung lượng.",
    ],
  },
  {
    id: 5,
    prompt: "Phân tích dữ liệu khách hàng trong doanh nghiệp",
    statements: [
      "Doanh nghiệp có thể dùng dữ liệu mua sắm để cá nhân hóa quảng cáo.",
      "Chỉ cần thu thập dữ liệu là có thể đưa ra quyết định kinh doanh đúng.",
      "Cần đảm bảo quyền riêng tư và bảo mật khi xử lý dữ liệu khách hàng.",
      "Các biểu đồ và báo cáo giúp ban lãnh đạo hiểu xu hướng hành vi khách hàng.",
    ],
  },
];

export const midFinalExamMultipleChoiceAnswers: Record<number, string> = {
  1: "C",
  2: "B",
  3: "C",
  4: "C",
  5: "B",
  6: "B",
  7: "A",
  8: "B",
  9: "C",
  10: "C",
  11: "C",
  12: "B",
  13: "A",
  14: "A",
  15: "C",
  16: "B",
  17: "C",
  18: "B",
  19: "A",
  20: "B",
  21: "A",
  22: "C",
  23: "A",
  24: "C",
  25: "A",
  26: "D",
};

export const midFinalExamTrueFalseAnswers: Record<
  number,
  Record<string, boolean>
> = {
  1: { A: true, B: true, C: false, D: false },
  2: { A: true, B: true, C: false, D: true },
  3: { A: true, B: false, C: true, D: false },
  4: { A: true, B: false, C: true, D: true },
  5: { A: true, B: false, C: true, D: true },
};
