// =====================================================
//  pages/redirectRequests.js
//
//  #/requests хуудас профайл дотор нэгдсэн.
//  Хуучин холбоос, хадгалсан хаяг ажиллаж байхын тулд
//  чимээгүй шилжүүлнэ.
// =====================================================

export default {
  access: 'student',
  layout: 'app',
  title : '',

  render({ go }) {
    go('#/profile?tab=status', { replace: true });
    return '';
  }
};