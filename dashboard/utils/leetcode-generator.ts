// LeetCode Solution Generator
// Generates realistic LeetCode solutions in various languages

interface LeetCodeProblem {
    number: number
    title: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
    category: string
    solution: string
    language: string
}

const LEETCODE_PROBLEMS = [
    // Easy Problems
    { id: 1, title: "Two Sum", difficulty: "Easy", category: "Array" },
    { id: 9, title: "Palindrome Number", difficulty: "Easy", category: "Math" },
    { id: 13, title: "Roman to Integer", difficulty: "Easy", category: "String" },
    { id: 14, title: "Longest Common Prefix", difficulty: "Easy", category: "String" },
    { id: 20, title: "Valid Parentheses", difficulty: "Easy", category: "Stack" },
    { id: 21, title: "Merge Two Sorted Lists", difficulty: "Easy", category: "Linked List" },
    { id: 26, title: "Remove Duplicates from Sorted Array", difficulty: "Easy", category: "Array" },
    { id: 27, title: "Remove Element", difficulty: "Easy", category: "Array" },
    { id: 28, title: "Find the Index of the First Occurrence", difficulty: "Easy", category: "String" },
    { id: 35, title: "Search Insert Position", difficulty: "Easy", category: "Binary Search" },

    // Medium Problems
    { id: 2, title: "Add Two Numbers", difficulty: "Medium", category: "Linked List" },
    { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Sliding Window" },
    { id: 5, title: "Longest Palindromic Substring", difficulty: "Medium", category: "Dynamic Programming" },
    { id: 11, title: "Container With Most Water", difficulty: "Medium", category: "Two Pointers" },
    { id: 15, title: "3Sum", difficulty: "Medium", category: "Array" },
    { id: 17, title: "Letter Combinations of a Phone Number", difficulty: "Medium", category: "Backtracking" },
    { id: 22, title: "Generate Parentheses", difficulty: "Medium", category: "Backtracking" },
    { id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", category: "Binary Search" },
    { id: 39, title: "Combination Sum", difficulty: "Medium", category: "Backtracking" },
    { id: 46, title: "Permutations", difficulty: "Medium", category: "Backtracking" },

    // Hard Problems
    { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard", category: "Binary Search" },
    { id: 10, title: "Regular Expression Matching", difficulty: "Hard", category: "Dynamic Programming" },
    { id: 23, title: "Merge k Sorted Lists", difficulty: "Hard", category: "Heap" },
    { id: 25, title: "Reverse Nodes in k-Group", difficulty: "Hard", category: "Linked List" },
    { id: 30, title: "Substring with Concatenation of All Words", difficulty: "Hard", category: "Sliding Window" },
    { id: 32, title: "Longest Valid Parentheses", difficulty: "Hard", category: "Dynamic Programming" },
    { id: 37, title: "Sudoku Solver", difficulty: "Hard", category: "Backtracking" },
    { id: 41, title: "First Missing Positive", difficulty: "Hard", category: "Array" },
    { id: 42, title: "Trapping Rain Water", difficulty: "Hard", category: "Two Pointers" },
    { id: 44, title: "Wildcard Matching", difficulty: "Hard", category: "Dynamic Programming" },
]

const SOLUTIONS = {
    "Two Sum": {
        python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Hash Map approach for O(n) time complexity
        """
        hashmap = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in hashmap:
                return [hashmap[complement], i]
            hashmap[num] = i
        return []`,

        javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const hashMap = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (hashMap.has(complement)) {
            return [hashMap.get(complement), i];
        }
        
        hashMap.set(nums[i], i);
    }
    
    return [];
};`,

        java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> hashMap = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            
            if (hashMap.containsKey(complement)) {
                return new int[] { hashMap.get(complement), i };
            }
            
            hashMap.put(nums[i], i);
        }
        
        return new int[] {};
    }
}`
    },

    "Palindrome Number": {
        python: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        """
        Check if number is palindrome without converting to string
        """
        if x < 0:
            return False
        
        original = x
        reversed_num = 0
        
        while x > 0:
            reversed_num = reversed_num * 10 + x % 10
            x //= 10
        
        return original == reversed_num`,

        cpp: `class Solution {
public:
    bool isPalindrome(int x) {
        if (x < 0) return false;
        
        long long original = x;
        long long reversed = 0;
        
        while (x > 0) {
            reversed = reversed * 10 + x % 10;
            x /= 10;
        }
        
        return original == reversed;
    }
};`
    },

    "Valid Parentheses": {
        python: `class Solution:
    def isValid(self, s: str) -> bool:
        """
        Stack-based approach for matching parentheses
        """
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        
        return not stack`,

        java: `class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        Map<Character, Character> mapping = new HashMap<>();
        mapping.put(')', '(');
        mapping.put('}', '{');
        mapping.put(']', '[');
        
        for (char c : s.toCharArray()) {
            if (mapping.containsKey(c)) {
                char top = stack.isEmpty() ? '#' : stack.pop();
                if (top != mapping.get(c)) {
                    return false;
                }
            } else {
                stack.push(c);
            }
        }
        
        return stack.isEmpty();
    }
}`
    }
}

export function generateLeetCodeSolution(): LeetCodeProblem {
    // Pick random problem
    const problem = LEETCODE_PROBLEMS[Math.floor(Math.random() * LEETCODE_PROBLEMS.length)]

    // Pick random language
    const languages = ['python', 'javascript', 'java', 'cpp']
    const language = languages[Math.floor(Math.random() * languages.length)]

    // Get solution or generate template
    const solutionKey = problem.title as keyof typeof SOLUTIONS
    const solution = SOLUTIONS[solutionKey]?.[language as keyof typeof SOLUTIONS[typeof solutionKey]] || generateTemplateSolution(problem, language)

    const fileExtension = {
        python: 'py',
        javascript: 'js',
        java: 'java',
        cpp: 'cpp'
    }[language]

    return {
        number: problem.id,
        title: problem.title,
        difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
        category: problem.category,
        solution,
        language: fileExtension || 'py'
    }
}

function generateTemplateSolution(problem: any, language: string): string {
    const templates = {
        python: `class Solution:
    def solve(self):
        """
        Problem: ${problem.title}
        Difficulty: ${problem.difficulty}
        Category: ${problem.category}
        
        TODO: Implement solution
        """
        pass`,

        javascript: `/**
 * Problem: ${problem.title}
 * Difficulty: ${problem.difficulty}
 * Category: ${problem.category}
 */
var solve = function() {
    // TODO: Implement solution
};`,

        java: `/**
 * Problem: ${problem.title}
 * Difficulty: ${problem.difficulty}
 * Category: ${problem.category}
 */
class Solution {
    public void solve() {
        // TODO: Implement solution
    }
}`,

        cpp: `/**
 * Problem: ${problem.title}
 * Difficulty: ${problem.difficulty}
 * Category: ${problem.category}
 */
class Solution {
public:
    void solve() {
        // TODO: Implement solution
    }
};`
    }

    return templates[language as keyof typeof templates] || templates.python
}

export function generateLeetCodeReadme(problem: LeetCodeProblem): string {
    return `# ${problem.number}. ${problem.title}

**Difficulty:** ${problem.difficulty}  
**Category:** ${problem.category}  
**Language:** ${problem.language.toUpperCase()}  

## Problem Description

LeetCode Problem #${problem.number}: ${problem.title}

## Solution

\`\`\`${problem.language}
${problem.solution}
\`\`\`

## Complexity Analysis

- **Time Complexity:** O(n)
- **Space Complexity:** O(n)

## Tags

- ${problem.category}
- ${problem.difficulty}
- LeetCode
- DSA

---

*Solution generated by GitMaxer LeetCode Plan*
`
}
