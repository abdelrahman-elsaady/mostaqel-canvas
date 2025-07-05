<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>أسعار التوصيل</title>
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      background-color: #f8f8f8;
      direction: rtl;
      padding: 30px;
    }
    .tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .tab {
      background-color: transparent;
      border: 1px solid #ccc;
      padding: 10px 15px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .tab.active {
      background-color: #ffe5e5;
      border-color: #f66;
      color: #c00;
    }
    .content {
      margin-top: 30px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.4s ease;
    }
    .content.show {
      opacity: 1;
      transform: translateY(0);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 15px;
      text-align: center;
    }
    th {
      background-color: #f3f3f3;
      position: relative;
    }
    .tooltip {
      position: absolute;
      bottom: 100%;
      background: #333;
      color: #fff;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      display: none;
    }
    th:hover .tooltip {
      display: block;
    }
  </style>
</head>
<body>
  <div class="tabs">
    <div class="tab" onclick="showPrices('cairo')">القاهرة والجيزة</div>
    <div class="tab" onclick="showPrices('alex')">الاسكندرية والبحيرة</div>
    <div class="tab" onclick="showPrices('delta')">الدلتا والقناة</div>
    <div class="tab" onclick="showPrices('north_upper')">شمال الصعيد</div>
    <div class="tab" onclick="showPrices('south_upper')">جنوب الصعيد</div>
    <div class="tab" onclick="showPrices('north_coast')">الساحل الشمالي</div>
    <div class="tab" onclick="showPrices('sinai')">سيناء والوادي الجديد</div>
  </div>

  <div id="priceContent" class="content"></div>

  <script>
    const data = {
      cairo: { name: 'القاهرة والجيزة', delivery: 91.2, exchange: 108.3, return: 102.6 },
      alex: { name: 'الاسكندرية والبحيرة', delivery: 96.9, exchange: 114, return: 102.6 },
      delta: {
        name: 'الدلتا والقناة',
        delivery: 103.7,
        exchange: 120.8,
        return: 102.6,
        desc: 'الدقهلية، القليوبية، الغربية، كفر الشيخ، المنوفية ،الشرقية، دمياط، الإسماعيلية، بورسعيد والسويس'
      },
      north_upper: {
        name: 'شمال الصعيد',
        delivery: 117.4,
        exchange: 134.5,
        return: 102.6,
        desc: 'الفيوم، بني سويف، المنيا، أسيوط، سوهاج'
      },
      south_upper: {
        name: 'جنوب الصعيد',
        delivery: 132.2,
        exchange: 149.3,
        return: 102.6,
        desc: 'قنا، الأقصر، أسوان، البحر الأحمر، مطروح'
      },
      north_coast: {
        name: 'الساحل الشمالي',
        delivery: 135.7,
        exchange: 152.8,
        return: 102.6
      },
      sinai: {
        name: 'سيناء والوادي الجديد',
        delivery: 150.5,
        exchange: 167.6,
        return: 102.6,
        desc: 'شمال سيناء، جنوب سيناء، الوادي الجديد'
      }
    };

    function showPrices(area) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      const d = data[area];
      document.getElementById('priceContent').innerHTML = `
        <h2>${d.name}</h2>
        ${d.desc ? `<p style="color: #666">${d.desc}</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>توصيل <span class="tooltip">أسعار شحنات "التوصيل" التي سوف يتم توصيلها لك.</span></th>
              <th>تبديل <span class="tooltip">أسعار شحنات "الاستبدال" التي سوف يتم استبدالها.</span></th>
              <th>إرجاع <span class="tooltip">أسعار شحنات "الإرجاع" التي سوف يتم استلامها منك لإرجاعها لنا</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${d.delivery}</td>
              <td>${d.exchange}</td>
              <td>${d.return}</td>
            </tr>
          </tbody>
        </table>
      `;
      document.getElementById('priceContent').classList.add('show');
    }
  </script>
</body>
</html>
