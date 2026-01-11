-- Seed 10 LeetCode problems

-- 1. Two Sum
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]',
  'easy',
  '[
    {"input": {"nums": [2,7,11,15], "target": 9}, "expected_output": [0,1], "is_sample": true},
    {"input": {"nums": [3,2,4], "target": 6}, "expected_output": [1,2], "is_sample": true},
    {"input": {"nums": [3,3], "target": 6}, "expected_output": [0,1], "is_sample": true},
    {"input": {"nums": [1,5,3,7,9], "target": 12}, "expected_output": [2,4]},
    {"input": {"nums": [-1,-2,-3,-4,-5], "target": -8}, "expected_output": [2,4]},
    {"input": {"nums": [0,4,3,0], "target": 0}, "expected_output": [0,3]},
    {"input": {"nums": [1,2,3,4,5,6,7,8,9,10], "target": 19}, "expected_output": [8,9]}
  ]'::jsonb,
  '{"python": "def two_sum(nums, target):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 2 <= nums.length <= 10^4
• -10^9 <= nums[i] <= 10^9
• -10^9 <= target <= 10^9
• Only one valid answer exists'
);

-- 2. Valid Palindrome
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Valid Palindrome',
  'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.

Example 2:
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.',
  'easy',
  '[
    {"input": {"s": "A man, a plan, a canal: Panama"}, "expected_output": true, "is_sample": true},
    {"input": {"s": "race a car"}, "expected_output": false, "is_sample": true},
    {"input": {"s": " "}, "expected_output": true, "is_sample": true},
    {"input": {"s": "Was it a car or a cat I saw?"}, "expected_output": true},
    {"input": {"s": "Madam"}, "expected_output": true},
    {"input": {"s": "0P"}, "expected_output": false},
    {"input": {"s": "ab_a"}, "expected_output": true}
  ]'::jsonb,
  '{"python": "def is_palindrome(s):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= s.length <= 2 * 10^5
• s consists only of printable ASCII characters'
);

-- 3. FizzBuzz
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'FizzBuzz',
  'Given an integer n, return a string array answer (1-indexed) where:
• answer[i] == "FizzBuzz" if i is divisible by 3 and 5.
• answer[i] == "Fizz" if i is divisible by 3.
• answer[i] == "Buzz" if i is divisible by 5.
• answer[i] == i (as a string) if none of the above conditions are true.

Example 1:
Input: n = 3
Output: ["1","2","Fizz"]

Example 2:
Input: n = 5
Output: ["1","2","Fizz","4","Buzz"]

Example 3:
Input: n = 15
Output: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
  'easy',
  '[
    {"input": {"n": 3}, "expected_output": ["1","2","Fizz"], "is_sample": true},
    {"input": {"n": 5}, "expected_output": ["1","2","Fizz","4","Buzz"], "is_sample": true},
    {"input": {"n": 15}, "expected_output": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"], "is_sample": true},
    {"input": {"n": 1}, "expected_output": ["1"]},
    {"input": {"n": 30}, "expected_output": ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz","16","17","Fizz","19","Buzz","Fizz","22","23","Fizz","Buzz","26","Fizz","28","29","FizzBuzz"]}
  ]'::jsonb,
  '{"python": "def fizz_buzz(n):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= n <= 10^4'
);

-- 4. Reverse String
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Reverse String',
  'Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

Example 1:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]

Example 2:
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]',
  'easy',
  '[
    {"input": {"s": ["h","e","l","l","o"]}, "expected_output": ["o","l","l","e","h"], "is_sample": true},
    {"input": {"s": ["H","a","n","n","a","h"]}, "expected_output": ["h","a","n","n","a","H"], "is_sample": true},
    {"input": {"s": ["A"]}, "expected_output": ["A"]},
    {"input": {"s": ["a","b"]}, "expected_output": ["b","a"]},
    {"input": {"s": ["r","a","c","e","c","a","r"]}, "expected_output": ["r","a","c","e","c","a","r"]}
  ]'::jsonb,
  '{"python": "def reverse_string(s):\n    # Your code here (modify s in-place)\n    pass"}'::jsonb,
  'Constraints:
• 1 <= s.length <= 10^5
• s[i] is a printable ascii character'
);

-- 5. Maximum Subarray
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Maximum Subarray',
  'Given an integer array nums, find the subarray with the largest sum, and return its sum.

Example 1:
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.

Example 2:
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.

Example 3:
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The subarray [5,4,-1,7,8] has the largest sum 23.',
  'medium',
  '[
    {"input": {"nums": [-2,1,-3,4,-1,2,1,-5,4]}, "expected_output": 6, "is_sample": true},
    {"input": {"nums": [1]}, "expected_output": 1, "is_sample": true},
    {"input": {"nums": [5,4,-1,7,8]}, "expected_output": 23, "is_sample": true},
    {"input": {"nums": [-1]}, "expected_output": -1},
    {"input": {"nums": [-2,-1]}, "expected_output": -1},
    {"input": {"nums": [1,2,3,4,5]}, "expected_output": 15},
    {"input": {"nums": [-1,-2,3,4,-1,2,1,-5,4]}, "expected_output": 9}
  ]'::jsonb,
  '{"python": "def max_subarray(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 10^5
• -10^4 <= nums[i] <= 10^4'
);

-- 6. Merge Two Sorted Lists
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Merge Two Sorted Lists',
  'You are given the heads of two sorted linked lists list1 and list2.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the merged linked list as an array.

Example 1:
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]

Example 2:
Input: list1 = [], list2 = []
Output: []

Example 3:
Input: list1 = [], list2 = [0]
Output: [0]',
  'easy',
  '[
    {"input": {"list1": [1,2,4], "list2": [1,3,4]}, "expected_output": [1,1,2,3,4,4], "is_sample": true},
    {"input": {"list1": [], "list2": []}, "expected_output": [], "is_sample": true},
    {"input": {"list1": [], "list2": [0]}, "expected_output": [0], "is_sample": true},
    {"input": {"list1": [1], "list2": [2]}, "expected_output": [1,2]},
    {"input": {"list1": [1,3,5], "list2": [2,4,6]}, "expected_output": [1,2,3,4,5,6]},
    {"input": {"list1": [1,2,3], "list2": [4,5,6]}, "expected_output": [1,2,3,4,5,6]}
  ]'::jsonb,
  '{"python": "def merge_two_lists(list1, list2):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• The number of nodes in both lists is in the range [0, 50]
• -100 <= Node.val <= 100
• Both list1 and list2 are sorted in non-decreasing order'
);

-- 7. Valid Parentheses
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Valid Parentheses',
  'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false',
  'easy',
  '[
    {"input": {"s": "()"}, "expected_output": true, "is_sample": true},
    {"input": {"s": "()[]{}"}, "expected_output": true, "is_sample": true},
    {"input": {"s": "(]"}, "expected_output": false, "is_sample": true},
    {"input": {"s": "([)]"}, "expected_output": false},
    {"input": {"s": "{[]}"}, "expected_output": true},
    {"input": {"s": ""}, "expected_output": true},
    {"input": {"s": "((()))"}, "expected_output": true},
    {"input": {"s": "(){}}{}{}"}, "expected_output": false}
  ]'::jsonb,
  '{"python": "def is_valid(s):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= s.length <= 10^4
• s consists of parentheses only ''()[]{}'''
);

-- 8. Best Time to Buy and Sell Stock
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Best Time to Buy and Sell Stock',
  'You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.',
  'easy',
  '[
    {"input": {"prices": [7,1,5,3,6,4]}, "expected_output": 5, "is_sample": true},
    {"input": {"prices": [7,6,4,3,1]}, "expected_output": 0, "is_sample": true},
    {"input": {"prices": [1,2]}, "expected_output": 1},
    {"input": {"prices": [2,4,1]}, "expected_output": 2},
    {"input": {"prices": [3,2,6,5,0,3]}, "expected_output": 4},
    {"input": {"prices": [1,2,3,4,5]}, "expected_output": 4}
  ]'::jsonb,
  '{"python": "def max_profit(prices):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= prices.length <= 10^5
• 0 <= prices[i] <= 10^4'
);

-- 9. Contains Duplicate
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Contains Duplicate',
  'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

Example 1:
Input: nums = [1,2,3,1]
Output: true

Example 2:
Input: nums = [1,2,3,4]
Output: false

Example 3:
Input: nums = [1,1,1,3,3,4,3,2,4,2]
Output: true',
  'easy',
  '[
    {"input": {"nums": [1,2,3,1]}, "expected_output": true, "is_sample": true},
    {"input": {"nums": [1,2,3,4]}, "expected_output": false, "is_sample": true},
    {"input": {"nums": [1,1,1,3,3,4,3,2,4,2]}, "expected_output": true, "is_sample": true},
    {"input": {"nums": []}, "expected_output": false},
    {"input": {"nums": [1]}, "expected_output": false},
    {"input": {"nums": [-1,-1]}, "expected_output": true},
    {"input": {"nums": [1,5,9,3,7,1]}, "expected_output": true}
  ]'::jsonb,
  '{"python": "def contains_duplicate(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 10^5
• -10^9 <= nums[i] <= 10^9'
);

-- 10. Single Number
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Single Number',
  'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

Example 1:
Input: nums = [2,2,1]
Output: 1

Example 2:
Input: nums = [4,1,2,1,2]
Output: 4

Example 3:
Input: nums = [1]
Output: 1',
  'easy',
  '[
    {"input": {"nums": [2,2,1]}, "expected_output": 1, "is_sample": true},
    {"input": {"nums": [4,1,2,1,2]}, "expected_output": 4, "is_sample": true},
    {"input": {"nums": [1]}, "expected_output": 1, "is_sample": true},
    {"input": {"nums": [1,3,1,3,5,5,7,7,9]}, "expected_output": 9},
    {"input": {"nums": [10,20,10]}, "expected_output": 20},
    {"input": {"nums": [-1]}, "expected_output": -1}
  ]'::jsonb,
  '{"python": "def single_number(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 3 * 10^4
• -3 * 10^4 <= nums[i] <= 3 * 10^4
• Each element in the array appears twice except for one element which appears only once'
);

-- 11. Longest Substring Without Repeating Characters
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Longest Substring Without Repeating Characters',
  'Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Example 3:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3. Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.',
  'medium',
  '[
    {"input": {"s": "abcabcbb"}, "expected_output": 3, "is_sample": true},
    {"input": {"s": "bbbbb"}, "expected_output": 1, "is_sample": true},
    {"input": {"s": "pwwkew"}, "expected_output": 3, "is_sample": true},
    {"input": {"s": ""}, "expected_output": 0},
    {"input": {"s": " "}, "expected_output": 1},
    {"input": {"s": "dvdf"}, "expected_output": 3},
    {"input": {"s": "abba"}, "expected_output": 2}
  ]'::jsonb,
  '{"python": "def length_of_longest_substring(s):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 0 <= s.length <= 5 * 10^4
• s consists of English letters, digits, symbols and spaces'
);

-- 12. Group Anagrams
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Group Anagrams',
  'Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example 1:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

Example 2:
Input: strs = [""]
Output: [[""]]

Example 3:
Input: strs = ["a"]
Output: [["a"]]',
  'medium',
  '[
    {"input": {"strs": ["eat","tea","tan","ate","nat","bat"]}, "expected_output": [["bat"],["nat","tan"],["ate","eat","tea"]], "is_sample": true},
    {"input": {"strs": [""]}, "expected_output": [[""]], "is_sample": true},
    {"input": {"strs": ["a"]}, "expected_output": [["a"]], "is_sample": true},
    {"input": {"strs": ["act","cat","tac","dog","god"]}, "expected_output": [["act","cat","tac"],["dog","god"]]},
    {"input": {"strs": ["abc","bca","cab","xyz","zyx"]}, "expected_output": [["abc","bca","cab"],["xyz","zyx"]]}
  ]'::jsonb,
  '{"python": "def group_anagrams(strs):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= strs.length <= 10^4
• 0 <= strs[i].length <= 100
• strs[i] consists of lowercase English letters'
);

-- 13. Product of Array Except Self
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Product of Array Except Self',
  'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in O(n) time and without using the division operator.

Example 1:
Input: nums = [1,2,3,4]
Output: [24,12,8,6]

Example 2:
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]',
  'medium',
  '[
    {"input": {"nums": [1,2,3,4]}, "expected_output": [24,12,8,6], "is_sample": true},
    {"input": {"nums": [-1,1,0,-3,3]}, "expected_output": [0,0,9,0,0], "is_sample": true},
    {"input": {"nums": [2,3,4,5]}, "expected_output": [60,40,30,24]},
    {"input": {"nums": [1,0]}, "expected_output": [0,1]},
    {"input": {"nums": [0,0]}, "expected_output": [0,0]},
    {"input": {"nums": [1,2,3]}, "expected_output": [6,3,2]}
  ]'::jsonb,
  '{"python": "def product_except_self(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 2 <= nums.length <= 10^5
• -30 <= nums[i] <= 30
• The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer'
);

-- 14. Top K Frequent Elements
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Top K Frequent Elements',
  'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.

Example 1:
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]

Example 2:
Input: nums = [1], k = 1
Output: [1]',
  'medium',
  '[
    {"input": {"nums": [1,1,1,2,2,3], "k": 2}, "expected_output": [1,2], "is_sample": true},
    {"input": {"nums": [1], "k": 1}, "expected_output": [1], "is_sample": true},
    {"input": {"nums": [4,1,-1,2,-1,2,3], "k": 2}, "expected_output": [-1,2]},
    {"input": {"nums": [1,2,3,4,5], "k": 3}, "expected_output": [1,2,3]},
    {"input": {"nums": [1,1,2,2,3,3], "k": 3}, "expected_output": [1,2,3]}
  ]'::jsonb,
  '{"python": "def top_k_frequent(nums, k):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 10^5
• -10^4 <= nums[i] <= 10^4
• k is in the range [1, the number of unique elements in the array]
• It is guaranteed that the answer is unique'
);

-- 15. Longest Palindromic Substring
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Longest Palindromic Substring',
  'Given a string s, return the longest palindromic substring in s.

Example 1:
Input: s = "babad"
Output: "bab"
Explanation: "aba" is also a valid answer.

Example 2:
Input: s = "cbbd"
Output: "bb"',
  'medium',
  '[
    {"input": {"s": "babad"}, "expected_output": "bab", "is_sample": true},
    {"input": {"s": "cbbd"}, "expected_output": "bb", "is_sample": true},
    {"input": {"s": "a"}, "expected_output": "a"},
    {"input": {"s": "ac"}, "expected_output": "a"},
    {"input": {"s": "racecar"}, "expected_output": "racecar"},
    {"input": {"s": "abcba"}, "expected_output": "abcba"}
  ]'::jsonb,
  '{"python": "def longest_palindrome(s):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= s.length <= 1000
• s consist of only digits and English letters'
);

-- 16. 3Sum
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  '3Sum',
  'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.

Example 1:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]
Explanation: 
nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.
The distinct triplets are [-1,0,1] and [-1,-1,2].
Notice that the order of the output and the order of the triplets does not matter.

Example 2:
Input: nums = [0,1,1]
Output: []
Explanation: The only possible triplet does not sum up to 0.

Example 3:
Input: nums = [0,0,0]
Output: [[0,0,0]]
Explanation: The only triplet sums up to 0.',
  'medium',
  '[
    {"input": {"nums": [-1,0,1,2,-1,-4]}, "expected_output": [[-1,-1,2],[-1,0,1]], "is_sample": true},
    {"input": {"nums": [0,1,1]}, "expected_output": [], "is_sample": true},
    {"input": {"nums": [0,0,0]}, "expected_output": [[0,0,0]], "is_sample": true},
    {"input": {"nums": [-2,0,1,1,2]}, "expected_output": [[-2,0,2],[-2,1,1]]},
    {"input": {"nums": [1,2,-2,-1]}, "expected_output": []},
    {"input": {"nums": [-1,0,1]}, "expected_output": [[-1,0,1]]}
  ]'::jsonb,
  '{"python": "def three_sum(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 3 <= nums.length <= 3000
• -10^5 <= nums[i] <= 10^5'
);

-- 17. Container With Most Water
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Container With Most Water',
  'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.

Example 1:
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.

Example 2:
Input: height = [1,1]
Output: 1',
  'medium',
  '[
    {"input": {"height": [1,8,6,2,5,4,8,3,7]}, "expected_output": 49, "is_sample": true},
    {"input": {"height": [1,1]}, "expected_output": 1, "is_sample": true},
    {"input": {"height": [1,2,1]}, "expected_output": 2},
    {"input": {"height": [4,3,2,1,4]}, "expected_output": 16},
    {"input": {"height": [1,2,4,3]}, "expected_output": 4},
    {"input": {"height": [2,3,4,5,18,17,6]}, "expected_output": 17}
  ]'::jsonb,
  '{"python": "def max_area(height):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• n == height.length
• 2 <= n <= 10^5
• 0 <= height[i] <= 10^4'
);

-- 18. Set Matrix Zeroes
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Set Matrix Zeroes',
  'Given an m x n integer matrix matrix, if an element is 0, set its entire row and column to 0''s. You must do it in place.

Example 1:
Input: matrix = [[1,1,1],[1,0,1],[1,1,1]]
Output: [[1,0,1],[0,0,0],[1,0,1]]

Example 2:
Input: matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]
Output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]]',
  'medium',
  '[
    {"input": {"matrix": [[1,1,1],[1,0,1],[1,1,1]]}, "expected_output": [[1,0,1],[0,0,0],[1,0,1]], "is_sample": true},
    {"input": {"matrix": [[0,1,2,0],[3,4,5,2],[1,3,1,5]]}, "expected_output": [[0,0,0,0],[0,4,5,0],[0,3,1,0]], "is_sample": true},
    {"input": {"matrix": [[1,2,3,4],[5,0,7,8],[9,10,11,12]]}, "expected_output": [[1,0,3,4],[0,0,0,0],[9,0,11,12]]},
    {"input": {"matrix": [[0,1],[1,1]]}, "expected_output": [[0,0],[0,1]]},
    {"input": {"matrix": [[1]]}, "expected_output": [[1]]}
  ]'::jsonb,
  '{"python": "def set_zeroes(matrix):\n    # Your code here (modify matrix in-place)\n    pass"}'::jsonb,
  'Constraints:
• m == matrix.length
• n == matrix[0].length
• 1 <= m, n <= 200
• -2^31 <= matrix[i][j] <= 2^31 - 1'
);

-- 19. Spiral Matrix
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Spiral Matrix',
  'Given an m x n matrix, return all elements of the matrix in spiral order.

Example 1:
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

Example 2:
Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]',
  'medium',
  '[
    {"input": {"matrix": [[1,2,3],[4,5,6],[7,8,9]]}, "expected_output": [1,2,3,6,9,8,7,4,5], "is_sample": true},
    {"input": {"matrix": [[1,2,3,4],[5,6,7,8],[9,10,11,12]]}, "expected_output": [1,2,3,4,8,12,11,10,9,5,6,7], "is_sample": true},
    {"input": {"matrix": [[1]]}, "expected_output": [1]},
    {"input": {"matrix": [[1,2],[3,4]]}, "expected_output": [1,2,4,3]},
    {"input": {"matrix": [[1,2,3,4,5]]}, "expected_output": [1,2,3,4,5]},
    {"input": {"matrix": [[1],[2],[3],[4]]}, "expected_output": [1,2,3,4]}
  ]'::jsonb,
  '{"python": "def spiral_order(matrix):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• m == matrix.length
• n == matrix[i].length
• 1 <= m, n <= 10
• -100 <= matrix[i][j] <= 100'
);

-- 20. Rotate Image
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Rotate Image',
  'You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).

You have to rotate the image in-place, which means you have to modify the input 2D matrix directly. DO NOT allocate another 2D matrix and do the rotation.

Example 1:
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]

Example 2:
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
  'medium',
  '[
    {"input": {"matrix": [[1,2,3],[4,5,6],[7,8,9]]}, "expected_output": [[7,4,1],[8,5,2],[9,6,3]], "is_sample": true},
    {"input": {"matrix": [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]}, "expected_output": [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]], "is_sample": true},
    {"input": {"matrix": [[1]]}, "expected_output": [[1]]},
    {"input": {"matrix": [[1,2],[3,4]]}, "expected_output": [[3,1],[4,2]]}
  ]'::jsonb,
  '{"python": "def rotate(matrix):\n    # Your code here (modify matrix in-place)\n    pass"}'::jsonb,
  'Constraints:
• n == matrix.length == matrix[i].length
• 1 <= n <= 20
• -1000 <= matrix[i][j] <= 1000'
);

-- 21. Word Search
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Word Search',
  'Given an m x n grid of characters board and a string word, return true if word exists in the grid.

The word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.

Example 1:
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"
Output: true

Example 2:
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"
Output: true

Example 3:
Input: board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"
Output: false',
  'medium',
  '[
    {"input": {"board": [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "word": "ABCCED"}, "expected_output": true, "is_sample": true},
    {"input": {"board": [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "word": "SEE"}, "expected_output": true, "is_sample": true},
    {"input": {"board": [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], "word": "ABCB"}, "expected_output": false, "is_sample": true},
    {"input": {"board": [["A"]], "word": "A"}, "expected_output": true},
    {"input": {"board": [["A","B"],["C","D"]], "word": "ACDB"}, "expected_output": true},
    {"input": {"board": [["A","B"],["C","D"]], "word": "ABCD"}, "expected_output": false}
  ]'::jsonb,
  '{"python": "def exist(board, word):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• m == board.length
• n = board[i].length
• 1 <= m, n <= 6
• 1 <= word.length <= 15
• board and word consists of only lowercase and uppercase English letters'
);

-- 22. Longest Increasing Subsequence
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Longest Increasing Subsequence',
  'Given an integer array nums, return the length of the longest strictly increasing subsequence.

Example 1:
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: The longest increasing subsequence is [2,3,7,18], therefore the length is 4.

Example 2:
Input: nums = [0,1,0,3,2,3]
Output: 4

Example 3:
Input: nums = [7,7,7,7,7,7,7]
Output: 1',
  'medium',
  '[
    {"input": {"nums": [10,9,2,5,3,7,101,18]}, "expected_output": 4, "is_sample": true},
    {"input": {"nums": [0,1,0,3,2,3]}, "expected_output": 4, "is_sample": true},
    {"input": {"nums": [7,7,7,7,7,7,7]}, "expected_output": 1, "is_sample": true},
    {"input": {"nums": [1,3,6,7,9,4,10,5,6]}, "expected_output": 6},
    {"input": {"nums": [1,2,3,4,5]}, "expected_output": 5},
    {"input": {"nums": [5,4,3,2,1]}, "expected_output": 1}
  ]'::jsonb,
  '{"python": "def length_of_lis(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 2500
• -10^4 <= nums[i] <= 10^4'
);

-- 23. Coin Change
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Coin Change',
  'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.

Example 1:
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1

Example 2:
Input: coins = [2], amount = 3
Output: -1

Example 3:
Input: coins = [1], amount = 0
Output: 0',
  'medium',
  '[
    {"input": {"coins": [1,2,5], "amount": 11}, "expected_output": 3, "is_sample": true},
    {"input": {"coins": [2], "amount": 3}, "expected_output": -1, "is_sample": true},
    {"input": {"coins": [1], "amount": 0}, "expected_output": 0, "is_sample": true},
    {"input": {"coins": [1,3,4], "amount": 6}, "expected_output": 2},
    {"input": {"coins": [2,5,10], "amount": 1}, "expected_output": -1},
    {"input": {"coins": [1,2,5], "amount": 100}, "expected_output": 20}
  ]'::jsonb,
  '{"python": "def coin_change(coins, amount):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= coins.length <= 12
• 1 <= coins[i] <= 2^31 - 1
• 0 <= amount <= 10^4'
);

-- 24. House Robber
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'House Robber',
  'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.

Given an integer array nums representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.

Example 1:
Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3). Total amount you can rob = 1 + 3 = 4.

Example 2:
Input: nums = [2,7,9,3,1]
Output: 12
Explanation: Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1). Total amount you can rob = 2 + 9 + 1 = 12.',
  'medium',
  '[
    {"input": {"nums": [1,2,3,1]}, "expected_output": 4, "is_sample": true},
    {"input": {"nums": [2,7,9,3,1]}, "expected_output": 12, "is_sample": true},
    {"input": {"nums": [2,1,1,2]}, "expected_output": 4},
    {"input": {"nums": [1]}, "expected_output": 1},
    {"input": {"nums": [1,2]}, "expected_output": 2},
    {"input": {"nums": [5,1,2,6,3,4]}, "expected_output": 15}
  ]'::jsonb,
  '{"python": "def rob(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 100
• 0 <= nums[i] <= 400'
);

-- 25. Jump Game
INSERT INTO problems (title, description, difficulty, test_cases, starter_code, constraints)
VALUES (
  'Jump Game',
  'You are given an integer array nums. You are initially positioned at the array''s first index, and each element in the array represents your maximum jump length at that position.

Return true if you can reach the last index, or false otherwise.

Example 1:
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.

Example 2:
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3. Its maximum jump length is 0, which makes it impossible to reach the last index.',
  'medium',
  '[
    {"input": {"nums": [2,3,1,1,4]}, "expected_output": true, "is_sample": true},
    {"input": {"nums": [3,2,1,0,4]}, "expected_output": false, "is_sample": true},
    {"input": {"nums": [0]}, "expected_output": true},
    {"input": {"nums": [1,0]}, "expected_output": true},
    {"input": {"nums": [0,1]}, "expected_output": false},
    {"input": {"nums": [2,0,0]}, "expected_output": true}
  ]'::jsonb,
  '{"python": "def can_jump(nums):\n    # Your code here\n    pass"}'::jsonb,
  'Constraints:
• 1 <= nums.length <= 10^4
• 0 <= nums[i] <= 10^5'
);
