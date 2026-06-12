#!/bin/bash
find src -type f -name "*.tsx" -exec sed -i -E '
  s/(^|[[:space:]"'\''`])bg-white([[:space:]"'\''`]|$)/\1bg-white dark:bg-slate-900\2/g;
  s/(^|[[:space:]"'\''`])bg-slate-50([[:space:]"'\''`]|$)/\1bg-slate-50 dark:bg-slate-950\2/g;
  s/(^|[[:space:]"'\''`])bg-slate-100([[:space:]"'\''`]|$)/\1bg-slate-100 dark:bg-slate-800\2/g;
  s/(^|[[:space:]"'\''`])bg-slate-200([[:space:]"'\''`]|$)/\1bg-slate-200 dark:bg-slate-700\2/g;
  s/(^|[[:space:]"'\''`])text-slate-900([[:space:]"'\''`]|$)/\1text-slate-900 dark:text-white\2/g;
  s/(^|[[:space:]"'\''`])text-slate-800([[:space:]"'\''`]|$)/\1text-slate-800 dark:text-slate-200\2/g;
  s/(^|[[:space:]"'\''`])text-slate-700([[:space:]"'\''`]|$)/\1text-slate-700 dark:text-slate-300\2/g;
  s/(^|[[:space:]"'\''`])text-slate-600([[:space:]"'\''`]|$)/\1text-slate-600 dark:text-slate-400\2/g;
  s/(^|[[:space:]"'\''`])text-slate-500([[:space:]"'\''`]|$)/\1text-slate-500 dark:text-slate-400\2/g;
  s/(^|[[:space:]"'\''`])border-slate-200([[:space:]"'\''`]|$)/\1border-slate-200 dark:border-slate-700\2/g;
  s/(^|[[:space:]"'\''`])border-slate-100([[:space:]"'\''`]|$)/\1border-slate-100 dark:border-slate-800\2/g;
  s/(^|[[:space:]"'\''`])border-slate-300([[:space:]"'\''`]|$)/\1border-slate-300 dark:border-slate-600\2/g;
  s/(^|[[:space:]"'\''`])hover:bg-slate-50([[:space:]"'\''`]|$)/\1hover:bg-slate-50 dark:hover:bg-slate-800\2/g;
  s/(^|[[:space:]"'\''`])hover:bg-slate-100([[:space:]"'\''`]|$)/\1hover:bg-slate-100 dark:hover:bg-slate-800\2/g;
' {} +

# Clean up duplicates if the script is run multiple times
find src -type f -name "*.tsx" -exec sed -i -E 's/dark:[a-z-0-9]+ dark:/\1 dark:/g' {} +
