with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = content.replace(
    '<div className=\"flex items-center gap-4 text-xs font-semibold text-slate-600\">\n            \n\n            <div className=\"relative',
    '<div className=\"flex items-center gap-4 text-xs font-semibold text-slate-600\">\n            <button onClick={handleLogout} className=\"lg:hidden text-rose-500 font-bold hover:underline\">Logout</button>\n            <div className=\"relative'
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
