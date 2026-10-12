/* ============================================================================
   XUYÊN KHÔNG CỔ ĐẠI — CHỢ CỔ: dữ liệu cấu hình
   (5 quầy, bản đồ chợ, trang bị, chủ đề, khách quen, chương, thành tựu)
   ========================================================================== */
window.CFG = {
  version: '2.0.0',
  saveKey: 'xuyenkhong_codai_v2',
  oldSaveKey: 'xuyenkhong_codai_v1',
  orderMult: 4,
  costGrowth: 1.15,
  offlineCapSec: 8 * 3600,
  offlineRate: 0.5,
  shiftSec: 240,          // một ca tiêu chuẩn 4 phút chơi thực
  tutorialShiftSec: 120,
  graceSec: 60,           // hết giờ nhận khách còn 60 giây hoàn thành đơn đã nhận

  /* ---- 5 quầy: kế thừa mã tiệm bản cũ để nối tiến trình ---- */
  shops: [
    { id: 'trada',  name: 'Trà Tửu Góc Cây Đa',    short: 'Trà đá', icon: '🍵', unlock: 0,     upBase: 15,   price: 1,   baseCPS: 1,   staffBase: 50,    itemCost: 0.4, pack: 20,
      map: [1205, 190], patience: [45, 60], spawn: [18, 26],
      desc: 'Bàn trà thấp bên gốc đa. Chính tay lấy bát, thêm đá, rót trà rồi mời khách.' },
    { id: 'trasua', name: 'Cổ Phương Trà Quán',    short: 'Trà sữa', icon: '🧋', unlock: 100,   upBase: 60,   price: 15,  baseCPS: 8,   staffBase: 500,   itemCost: 2.5, pack: 10,
      map: [150, 150], patience: [65, 85], spawn: [22, 32],
      desc: 'Trà cổ phương pha cùng trân châu. Lấy ly, thêm topping, rót trà, sữa, đường, đá rồi ép nắp.' },
    { id: 'banhmi', name: 'Cổ Phong Tráp Bánh Mì', short: 'Bánh mì', icon: '🥖', unlock: 500,   upBase: 300,  price: 45,  baseCPS: 25,  staffBase: 2500,  itemCost: 8,   pack: 10,
      map: [735, 125], patience: [70, 90], spawn: [24, 34],
      desc: 'Bánh mì nướng lò than. Canh độ chín, rạch bánh, phết pate, thêm nhân rồi gói giấy.' },
    { id: 'xoi',    name: 'Bát Tấm Xôi Trang',     short: 'Xôi', icon: '🍚', unlock: 2500,  upBase: 1500, price: 150, baseCPS: 80,  staffBase: 12000, itemCost: 25,  pack: 10,
      map: [975, 150], patience: [60, 80], spawn: [22, 32],
      desc: 'Hấp mẻ xôi trước ca, đơm từng muỗng lên lá chuối, thêm topping rồi gói lá buộc lạt.' },
    { id: 'mycay',  name: 'Thất Cấp Hỏa Ma Đường', short: 'Mỳ cay', icon: '🍜', unlock: 10000, upBase: 6000, price: 500, baseCPS: 260, staffBase: 60000, itemCost: 70,  pack: 10,
      map: [455, 140], patience: [80, 100], spawn: [28, 40],
      desc: 'Trụng mỳ, múc nước dùng, thêm topping rồi nêm cay đúng cấp 1–7 của từng vị khách.' },
  ],

  /* ---- điểm chạm khác trên bản đồ (tọa độ ảnh nền 1672×941) ---- */
  npcs: [
    { id: 'batu',   name: 'Bà Tư',   avatar: '👵', at: [860, 430], role: 'Bà bán xôi, người dẫn đường', kind: 'npc' },
    { id: 'tholo',  name: 'Thợ Lỗ',  avatar: '🧑‍🔧', at: [540, 385], role: 'Thợ sửa máy ép, dựng quầy', kind: 'npc' },
    { id: 'hanmac', name: 'Hàn Mặc', avatar: '🧑‍🎓', at: [175, 440], role: 'Thư sinh, khách quen', kind: 'npc' },
    { id: 'duocsu', name: 'Dược sư', avatar: '🧙', at: [1190, 440], role: 'Gian thảo mộc (chưa khai trương)', kind: 'npc' },
    { id: 'cong',   name: 'Cổng Chợ', avatar: '🏮', at: [1520, 120], role: 'Bảng sự kiện', kind: 'gate' },
    { id: 'nl1',    name: 'Nhập hàng', avatar: '🧺', at: [410, 720], role: 'Gian thủy sản', kind: 'supply' },
    { id: 'nl2',    name: 'Nhập hàng', avatar: '🧺', at: [800, 720], role: 'Gian thịt tươi', kind: 'supply' },
    { id: 'nl3',    name: 'Nhập hàng', avatar: '🧺', at: [1170, 735], role: 'Gian hoa tươi', kind: 'supply' },
    { id: 'nl4',    name: 'Nhập hàng', avatar: '🧺', at: [1510, 730], role: 'Gian nông sản', kind: 'supply' },
  ],

  /* ---- vật tư / nguyên liệu mỗi quầy (đơn vị = một phần). w = hệ số giá, start = tồn khi mở quầy ---- */
  items: {
    trada: [
      { id: 'bat_s', name: 'Bát nhỏ', icon: '🥣', w: 0, start: 6, reuse: true }, { id: 'bat_l', name: 'Bát lớn', icon: '🍲', w: 0, start: 4, reuse: true },
      { id: 'tra', name: 'Trà', icon: '🍵', w: 1, start: 30 }, { id: 'da', name: 'Đá', icon: '🧊', w: 1, start: 30 }, { id: 'mat', name: 'Mật', icon: '🍯', w: 1.5, start: 12 },
    ],
    trasua: [
      { id: 'ly_M', name: 'Ly M', icon: '🥤', w: 1, start: 14 }, { id: 'ly_L', name: 'Ly L', icon: '🥤', w: 1.3, start: 8 }, { id: 'nap', name: 'Nắp', icon: '⭕', w: 0.6, start: 22 }, { id: 'hut', name: 'Ống hút', icon: '〰️', w: 0.4, start: 22 },
      { id: 'tra_hong', name: 'Hồng trà', icon: '🍂', w: 1, start: 12 }, { id: 'tra_luc', name: 'Lục trà', icon: '🍃', w: 1, start: 12 }, { id: 'tra_olong', name: 'Ô long', icon: '🌿', w: 1.2, start: 10 }, { id: 'tra_matcha', name: 'Matcha', icon: '🍵', w: 1.5, start: 6 },
      { id: 'sua_tuoi', name: 'Sữa tươi', icon: '🥛', w: 1, start: 14 }, { id: 'sua_dac', name: 'Sữa đặc', icon: '🍼', w: 1, start: 8 }, { id: 'kem', name: 'Kem cheese', icon: '🧀', w: 1.6, start: 6 },
      { id: 'duong', name: 'Đường', icon: '🍬', w: 0.5, start: 24 }, { id: 'duong_den', name: 'Đường đen', icon: '🟤', w: 0.8, start: 10 }, { id: 'da', name: 'Đá', icon: '🧊', w: 0.4, start: 24 },
      { id: 'tc_den', name: 'Trân châu đen', icon: '⚫', w: 1, start: 16 }, { id: 'quylinh', name: 'Thạch quy linh', icon: '🟫', w: 1, start: 12 }, { id: 'pudding', name: 'Pudding', icon: '🍮', w: 1.2, start: 10 }, { id: 'hatsen', name: 'Hạt sen', icon: '🤍', w: 1.4, start: 8 },
    ],
    banhmi: [
      { id: 'banh_s', name: 'Ổ nhỏ', icon: '🥖', w: 1, start: 10 }, { id: 'banh_l', name: 'Ổ lớn', icon: '🥖', w: 1.5, start: 6 }, { id: 'giay', name: 'Giấy gói', icon: '📜', w: 0.4, start: 16 },
      { id: 'pate', name: 'Pate', icon: '🫙', w: 0.8, start: 20 }, { id: 'xaxiu', name: 'Xá xíu', icon: '🥩', w: 1.4, start: 20 }, { id: 'trung', name: 'Trứng', icon: '🍳', w: 1, start: 10 },
      { id: 'dua', name: 'Dưa góp', icon: '🥕', w: 0.5, start: 14 }, { id: 'rau', name: 'Rau mùi', icon: '🌿', w: 0.4, start: 14 }, { id: 'ot', name: 'Sốt ớt', icon: '🌶️', w: 0.5, start: 10 },
    ],
    xoi: [
      { id: 'nep_gac', name: 'Nếp gấc', icon: '🔴', w: 1.5, start: 1, batch: true }, { id: 'nep_nuong', name: 'Nếp nương', icon: '⚪', w: 1, start: 1, batch: true },
      { id: 'nep_dua', name: 'Nếp dừa', icon: '🟡', w: 1.2, start: 1, batch: true }, { id: 'nep_ngusac', name: 'Nếp ngũ sắc', icon: '🌈', w: 2.5, start: 0, batch: true },
      { id: 'la', name: 'Lá chuối', icon: '🍃', w: 0.4, start: 14 }, { id: 'dia', name: 'Đĩa', icon: '🍽️', w: 0, start: 6, reuse: true }, { id: 'lat', name: 'Lạt buộc', icon: '🪢', w: 0.2, start: 16 },
      { id: 'ga', name: 'Gà xé phay', icon: '🍗', w: 1.5, start: 16 }, { id: 'dau', name: 'Đậu xanh', icon: '🫛', w: 0.8, start: 16 }, { id: 'hanh', name: 'Hành phi', icon: '🧅', w: 0.6, start: 16 }, { id: 'dua', name: 'Dừa nạo', icon: '🥥', w: 0.8, start: 16 },
    ],
    mycay: [
      { id: 'to_s', name: 'Tô nhỏ', icon: '🥣', w: 0.5, start: 8 }, { id: 'to_l', name: 'Tô lớn', icon: '🍲', w: 0.8, start: 6 }, { id: 'dua_an', name: 'Đũa', icon: '🥢', w: 0.3, start: 16 },
      { id: 'mi', name: 'Mỳ', icon: '🍜', w: 1.2, start: 14 }, { id: 'nuoc_rau', name: 'Nước dùng nấm', icon: '🍄', w: 1, start: 10 }, { id: 'nuoc_thit', name: 'Nước dùng thịt', icon: '🍖', w: 1.4, start: 10 },
      { id: 'thit', name: 'Thịt', icon: '🥩', w: 1.5, start: 14 }, { id: 'nam', name: 'Nấm', icon: '🍄', w: 1, start: 12 }, { id: 'rau', name: 'Rau', icon: '🥬', w: 0.6, start: 14 }, { id: 'trung', name: 'Trứng', icon: '🥚', w: 0.8, start: 12 }, { id: 'ot', name: 'Ớt', icon: '🌶️', w: 0.7, start: 20 },
    ],
  },

  /* ---- trang bị (cấp 0–3): giá = ceil(upBase × k × 2,2^(cấp−1)); cần cấp quầy 1/3/5 ---- */
  equip: {
    common: [
      { id: 'khay', name: 'Khay giữ món', k: 1.5, icon: '🗄️', tiers: ['1 ô giữ món hoàn thiện', '2 ô giữ món', '3 ô giữ món'] },
      { id: 'mai', name: 'Mái che, đèn', k: 1, icon: '🏮', tiers: ['+3 giây kiên nhẫn', '+6 giây kiên nhẫn', '+10 giây kiên nhẫn'] },
      { id: 'bien', name: 'Biển hiệu', k: 1.3, icon: '🪧', tiers: ['Giá món +5%', 'Giá món +10%', 'Giá món +18%'] },
      { id: 'tip', name: 'Hộp tiền thưởng', k: 1.1, icon: '🎁', tiers: ['Tiền thưởng +25%', 'Tiền thưởng +50%', 'Tiền thưởng +100%'] },
      { id: 'kho', name: 'Kho lạnh', k: 1.4, icon: '❄️', tiers: ['Gói nhập hàng +10%', 'Gói nhập hàng +20%', 'Gói nhập hàng +35%'] },
      { id: 'ship', name: 'Túi giao hàng', k: 1.2, icon: '🛍️', tiers: ['Đơn online +10% tiền', 'Đơn online +25% tiền, giao nhanh hơn', 'Đơn online +45% tiền, giao nhanh hơn nữa'] },
    ],
    trada: [
      { id: 'am', name: 'Ấm đồng', k: 1, icon: '🫖', tiers: ['Vạch lượng rõ hơn', 'Rót nhanh hơn 10%', 'Tự dừng khi đủ lượng (bật Hỗ trợ)'] },
      { id: 'gia', name: 'Giá bát', k: 0.8, icon: '🥣', tiers: ['Lấy bát 0,5 giây', 'Lấy bát 0,35 giây', 'Lấy bát 0,2 giây'] },
      { id: 'chau', name: 'Chậu rửa', k: 1.2, icon: '🧼', tiers: ['Rửa 0,6 giây', 'Rửa 0,45 giây', 'Rửa 0,3 giây'] },
    ],
    trasua: [
      { id: 'voi', name: 'Vòi rót', k: 1, icon: '🚰', tiers: ['Vạch lượng rõ hơn', 'Rót nhanh hơn 10%', 'Tự dừng ở lượng mục tiêu (bật Hỗ trợ)'] },
      { id: 'ep', name: 'Máy ép nắp', k: 2, icon: '⚙️', tiers: ['Ép 1,6 giây', 'Ép 1,2 giây', 'Ép 0,8 giây'] },
      { id: 'muong', name: 'Muỗng topping', k: 1, icon: '🥄', tiers: ['Hiện lượng múc', 'Múc 1–2 phần mỗi lần', 'Một lần múc đủ lượng theo đơn'] },
      { id: 'khuay', name: 'Bình khuấy', k: 1.2, icon: '🧪', tiers: ['Khuấy 1,2 giây', 'Khuấy 0,9 giây', 'Khuấy 0,6 giây'] },
    ],
    banhmi: [
      { id: 'lo', name: 'Lò than', k: 2, icon: '🔥', tiers: ['Vạch nhiệt rõ hơn', 'Vùng vàng giòn rộng thêm 1 giây', 'Tự tắt nhiệt và giữ ấm'] },
      { id: 'dao', name: 'Dao', k: 1, icon: '🔪', tiers: ['Rạch 0,8 giây', 'Rạch 0,6 giây', 'Rạch 0,4 giây'] },
      { id: 'goi', name: 'Bàn gói', k: 1.2, icon: '📜', tiers: ['Gói 1,5 giây', 'Gói 1,1 giây', 'Gói 0,8 giây'] },
    ],
    xoi: [
      { id: 'xung', name: 'Xửng hấp', k: 2, icon: '🥘', tiers: ['Mẻ 10 phần', 'Mẻ 15 phần', 'Mẻ 20 phần'] },
      { id: 'can', name: 'Cân', k: 1, icon: '⚖️', tiers: ['Hiện số muỗng', 'Đánh dấu đủ muỗng', 'Một muỗng định lượng theo cỡ'] },
      { id: 'khuon', name: 'Khuôn ngũ sắc', k: 1.5, icon: '🌈', tiers: ['Gợi ý màu', 'Giữ vị trí màu', 'Xếp 5 màu trong 1,2 giây'] },
    ],
    mycay: [
      { id: 'bep', name: 'Bếp', k: 2, icon: '🔥', tiers: ['Nhiệt ổn định', 'Vùng chín rộng thêm 1 giây', 'Chuông báo, tự ngừng nhiệt'] },
      { id: 'ot', name: 'Muỗng ớt', k: 1, icon: '🥄', tiers: ['Đánh dấu cấp mục tiêu', 'Kim chậm hơn 15%', 'Chọn cấp trực tiếp (bật Hỗ trợ)'] },
      { id: 'noi', name: 'Nồi nước dùng', k: 1.5, icon: '🍲', tiers: ['10 phần mỗi mẻ', '15 phần mỗi mẻ', '20 phần mỗi mẻ'] },
    ],
  },

  /* ---- khách ---- */
  customers: [
    { name: 'Nông phu', avatar: '🧑‍🌾' }, { name: 'Thư sinh', avatar: '🧑‍🎓' }, { name: 'Tiểu thư', avatar: '👩‍🦰' }, { name: 'Lão gia', avatar: '👴' },
    { name: 'Đạo sĩ', avatar: '🧙' }, { name: 'Hiệp khách', avatar: '🥷' }, { name: 'Thương nhân', avatar: '🧔' }, { name: 'Bà lão', avatar: '👵' },
    { name: 'Tiểu đồng', avatar: '🧒' }, { name: 'Võ sư', avatar: '🥋' }, { name: 'Quan binh', avatar: '💂' },
  ],
  vipCustomers: [{ name: 'Quận Chúa', avatar: '👸' }, { name: 'Thái Thú', avatar: '🤴' }, { name: 'Đại Thương Gia', avatar: '🤵' }],
  regulars: [
    { id: 'laoba', name: 'Lão bá', avatar: '👴', shop: 'trada', likes: 'ít đá, không mật' },
    { id: 'linhchi', name: 'Linh Chi', avatar: '👩‍🦰', shop: 'trasua', likes: 'đổi topping theo mùa' },
    { id: 'hanmac', name: 'Hàn Mặc', avatar: '🧑‍🎓', shop: 'banhmi', likes: 'bữa sáng không cay' },
    { id: 'tin', name: 'Chú Tín', avatar: '🧔', shop: 'banhmi', likes: 'không ăn rau mùi' },
    { id: 'batu', name: 'Bà Tư', avatar: '👵', shop: 'xoi', likes: 'kiểm tra tay nghề xôi' },
    { id: 'hiepkhach', name: 'Hiệp Khách', avatar: '🥷', shop: 'mycay', likes: 'cay cấp 7' },
  ],

  ranks: [[0, 'Bình Dân'], [500, 'Tiểu Thương'], [5000, 'Chưởng Quầy'], [60000, 'Phú Hộ'], [800000, 'Đại Phú Hào'], [20e6, 'Thương Gia Hoàng Triều'], [1e9, 'Phú Khả Địch Quốc']],

  /* ---- 6 chương cốt truyện, mục tiêu đo được ---- */
  chapters: [
    { id: 1, title: 'Một ấm trà dưới gốc đa', story: 'Sau cơn mưa, bạn tỉnh dậy bên cổng chợ với chiếc ấm cũ. Bà Tư cho mượn một bàn gỗ: “Có tay nghề thì chẳng lo đói. Thử rót cho lão bá một bát xem nào.”',
      goal: 'Giao 10 bát trà, hoàn hảo 3 bát', prog: (s) => `${Math.min(10, s.shops.trada.served)}/10 bát · ${Math.min(3, s.shops.trada.perfectN)}/3 hoàn hảo`, check: (s) => s.shops.trada.served >= 10 && s.shops.trada.perfectN >= 3, reward: { coins: 60 }, rewardText: '60 xu, đủ mở quán trà sữa' },
    { id: 2, title: 'Món trà lạ của người phương xa', story: 'Tiểu thư Linh Chi muốn một món “vừa thơm trà, vừa ngọt sữa, có hạt nhai vui miệng”. Thợ Lỗ nhận làm khung ép nắp.',
      goal: 'Mở Cổ Phương Trà Quán, giao 5 ly chuẩn', prog: (s) => s.shops.trasua.unlocked ? `${Math.min(5, s.shops.trasua.perfectN)}/5 ly chuẩn` : 'Chưa mở quầy trà sữa', check: (s) => s.shops.trasua.unlocked && s.shops.trasua.perfectN >= 5, reward: { coins: 150, gold: 2 }, rewardText: '150 xu, 2 nguyên bảo, tem biểu tượng riêng' },
    { id: 3, title: 'Mùi bánh nóng trên phố', story: 'Gian của bác thợ bánh bỏ trống sau mùa mưa. Hãy sửa lò và giao bữa sáng cho thư viện.',
      goal: 'Mở quầy bánh mì, nướng 5 ổ chuẩn', prog: (s) => s.shops.banhmi.unlocked ? `${Math.min(5, s.shops.banhmi.perfectN)}/5 ổ chuẩn` : 'Chưa mở quầy bánh mì', check: (s) => s.shops.banhmi.unlocked && s.shops.banhmi.perfectN >= 5, reward: { coins: 600, gold: 2 }, rewardText: '600 xu, biển thư pháp của Hàn Mặc' },
    { id: 4, title: 'Mẻ xôi ngũ sắc ngày hội', story: 'Bà Tư nhờ bạn chuẩn bị xôi cho hội làng: hấp mẻ nếp, đơm xôi, gói lá buộc lạt.',
      goal: 'Mở quầy xôi, giao 8 phần', prog: (s) => s.shops.xoi.unlocked ? `${Math.min(8, s.shops.xoi.served)}/8 phần` : 'Chưa mở quầy xôi', check: (s) => s.shops.xoi.unlocked && s.shops.xoi.served >= 8, reward: { coins: 2500, gold: 3 }, rewardText: '2.500 xu, công thức xôi ngũ sắc' },
    { id: 5, title: 'Bảy tầng hỏa vị', story: 'Hiệp khách tới làng thách một tô mỳ cay. Làm đúng khẩu vị đều được ghi nhận ngang nhau.',
      goal: 'Mở quầy mỳ cay, giao 5 tô chuẩn', prog: (s) => s.shops.mycay.unlocked ? `${Math.min(5, s.shops.mycay.perfectN)}/5 tô chuẩn` : 'Chưa mở quầy mỳ cay', check: (s) => s.shops.mycay.unlocked && s.shops.mycay.perfectN >= 5, reward: { coins: 8000, gold: 4 }, rewardText: '8.000 xu, bảng danh hiệu Hỏa Vị' },
    { id: 6, title: 'Chợ lên đèn', story: 'Năm quầy hoạt động, hội đồng làng đề nghị khôi phục sân hội và tổ chức Đêm Hoa Đăng.',
      goal: 'Kiếm tổng cộng 1.000.000 xu', prog: (s) => `${Math.floor(s.stats.earned).toLocaleString('vi-VN')}/1.000.000 xu`, check: (s) => s.stats.earned >= 1e6, reward: { gold: 10 }, rewardText: '10 nguyên bảo, Đêm Hoa Đăng' },
  ],

  themes: [
    { id: 'thanhphong', name: 'Thanh Phong', sub: 'Hoa đào rơi', desc: 'Sắc hồng đào dịu nhẹ, cánh hoa đào xoay rơi theo gió.', sw: ['#fde8ec', '#c8445f', '#f2b84a'], nightly: false },
    { id: 'daituong', name: 'Đại Đường', sub: 'Lồng đèn đỏ', desc: 'Đỏ son vàng kim của hoàng thành, đom đóm vàng bay lên.', sw: ['#3a0d12', '#d8392b', '#f5c542'], nightly: true },
    { id: 'giangnam', name: 'Giang Nam', sub: 'Yên vũ', desc: 'Xanh liễu mưa bụi, lá liễu lất phất giữa sương mù.', sw: ['#e2f0e6', '#3f7d5b', '#e0b84a'], nightly: false },
    { id: 'thuymac', name: 'Thủy Mặc', sub: 'Sơn thủy', desc: 'Giấy dó và mực tàu, nét cọ thủy mặc, ấn đỏ son.', sw: ['#f1ede4', '#2b2b2b', '#b8322a'], nightly: false },
    { id: 'dahoi', name: 'Dạ Hội Hoa Đăng', sub: 'Đêm đèn', desc: 'Đêm hội hoa đăng, đèn trời lấp lánh bay lên bầu trời tím.', sw: ['#161a40', '#7a4ad8', '#ffb347'], nightly: true },
  ],

  perks: [
    { id: 'boost', icon: '🧧', name: 'Tài Lộc Phù', desc: 'Doanh thu ×2 trong 10 phút.', cost: 8 },
    { id: 'cash', icon: '💰', name: 'Túi Gấm Xu', desc: 'Nhận ngay thu nhập quản lý của 10 phút (tối thiểu 50 xu).', cost: 6 },
    { id: 'patience', icon: '🍵', name: 'Trà Tĩnh Tâm', desc: 'Khách kiên nhẫn hơn 20% trong ca hiện tại.', cost: 4 },
  ],

  achievements: [
    { id: 'a1', name: 'Bát Trà Đầu Tiên', desc: 'Giao 5 bát trà.', gold: 1, check: (s) => s.shops.trada.served >= 5 },
    { id: 'a2', name: 'Trăm Đồng Xu', desc: 'Kiếm tổng cộng 100 xu.', gold: 1, check: (s) => s.stats.earned >= 100 },
    { id: 'a3', name: 'Chủ Quán Trà Sữa', desc: 'Mở khóa Cổ Phương Trà Quán.', gold: 2, check: (s) => s.shops.trasua.unlocked },
    { id: 'a4', name: 'Pha Chế Hoàn Hảo', desc: 'Giao chuẩn 10 đơn.', gold: 2, check: (s) => s.stats.perfect >= 10 },
    { id: 'a5', name: 'Tiểu Nhị Đầu Tiên', desc: 'Thuê một tiểu nhị.', gold: 2, check: (s) => Object.values(s.shops).some((x) => x.staff > 0) },
    { id: 'a6', name: 'Chợ Nhộn Nhịp', desc: 'Mở khóa 4 quầy.', gold: 3, check: (s) => Object.values(s.shops).filter((x) => x.unlocked).length >= 4 },
    { id: 'a7', name: 'Ca Đầu Tiên', desc: 'Chốt xong một ca bán.', gold: 2, check: (s) => s.stats.shifts >= 1 },
    { id: 'a8', name: 'Chuỗi Năm Đơn Chuẩn', desc: 'Nhận thưởng chuỗi ×2 ở quầy trà sữa.', gold: 3, check: (s) => s.stats.streaks >= 1 },
    { id: 'a9', name: 'Ngàn Xu Vào Túi', desc: 'Kiếm tổng cộng 10.000 xu.', gold: 3, check: (s) => s.stats.earned >= 1e4 },
    { id: 'a10', name: 'Đại Phú Hào', desc: 'Kiếm tổng cộng 1.000.000 xu.', gold: 8, check: (s) => s.stats.earned >= 1e6 },
  ],
};
