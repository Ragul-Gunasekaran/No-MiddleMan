with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
new_lines = lines[:832] + [
    '          {/* Logout Action */}\n',
    '          <div className=\"pt-2 border-t border-slate-700/60 flex flex-col gap-2\">\n',
    '            <button onClick={handleLogout} className=\"w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg font-bold transition shadow-sm\">Logout</button>\n',
    '          </div>\n',
    '        </div>\n'
] + lines[851:]
with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
