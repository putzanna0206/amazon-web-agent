export default function TestSimplePage() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1 style={{ color: 'darkblue' }}>测试页面</h1>
      <p>如果你能看到这个页面,说明基本的HTML/CSS渲染是正常的。</p>
      <p style={{ fontSize: '24px', color: 'red' }}>红色大字测试</p>
      <button style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white' }}>
        测试按钮
      </button>
    </div>
  );
}
