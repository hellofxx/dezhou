/**
 * TableRail — 纯装饰性跨页面签名元素（胡桃木轨道中的黄铜铆钉）
 */
export default function TableRail() {
  return (
    <div className="table-rail" aria-hidden="true">
      <div className="rail-line" />
      <div className="rail-stud" />
      <div className="rail-line" />
    </div>
  );
}
