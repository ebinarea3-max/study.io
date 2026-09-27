const fs = require('fs');

const file = 'src/components/timer/StudyTimer.tsx';
let content = fs.readFileSync(file, 'utf8');

// The end of the file looks like:
//         </div>
//       </div>
//     </div>
//     </div>
//     </div>
//   );
// }
// We need to replace 5 </div> with 4 </div>.
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, '</div>\\n    </div>\\n    </div>\\n    </div>\\n  );\\n}');
// wait, the replacement string should literally be the divs.
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/, '      </div>\\n    </div>\\n    </div>\\n    </div>\\n  );\\n}');
fs.writeFileSync(file, content, 'utf8');

console.log("Fixed extra div at bottom of StudyTimer.tsx");
