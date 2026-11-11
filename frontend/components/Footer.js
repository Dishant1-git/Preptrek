// Crudify signature: a little "code tag" badge that reveals what CRUD stands for on hover
export default function Footer() {
  return (
    <footer className="footer">
      <a href="https://www.crudify.in" target="_blank" rel="noreferrer" className="crafted">
        <span className="star">✦</span>
        <code>
          <span className="tag">&lt;crafted</span> <span className="attr">by</span>=
          <span className="val">&quot;Team Crudify&quot;</span> <span className="tag">/&gt;</span>
        </code>
        <span className="crud">
          <b>C</b>reate · <b>R</b>ead · <b>U</b>pdate · <b>D</b>eliver
        </span>
      </a>
      <small>www.crudify.in</small>
    </footer>
  );
}
