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
