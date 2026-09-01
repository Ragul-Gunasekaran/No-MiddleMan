with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find the exact indices
start = next(i for i, l in enumerate(lines) if "Demo Mode Switch" in l) - 2
end = next(i for i, l in enumerate(lines[start:]) if "</div>" in l and "Sidebar Nav" in lines[start+i+3]) + start + 2

# We want to replace from start to end-1 with our logout action
new_lines = lines[:start] + [
    '          {/* Logout Action */}\n',
    '          <div className=\"pt-2 border-t border-slate-700/60 flex flex-col gap-2\">\n',
    '            <button onClick={handleLogout} className=\"w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg font-bold transition shadow-sm\">Logout</button>\n',
    '          </div>\n',
    '        </div>\n'
] + lines[end:]

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
