export type TestResult = {
  passed: boolean
  input: any
  expected: any
  actual: any
  error?: string
}

export type ExecutionResult = {
  success: boolean
  results: TestResult[]
  allPassed: boolean
  error?: string
}

export async function executeCode(
  code: string,
  language: string,
  testCases: any[]
): Promise<ExecutionResult> {
  try {
    const results: TestResult[] = []
    let allPassed = true

    for (const testCase of testCases) {
      try {
        // Prepare the code with test case
        const fullCode = prepareCodeForExecution(code, language, testCase)

        // Execute via Piston API
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: language,
            version: '*',
            files: [
              {
                name: 'main.py',
                content: fullCode,
              },
            ],
            stdin: '',
            args: [],
            compile_timeout: 10000,
            run_timeout: 5000,
          }),
        })

        if (!response.ok) {
          throw new Error(`Piston API error: ${response.statusText}`)
        }

        const result = await response.json()

        if (result.run.code !== 0 || result.run.stderr) {
          // Runtime error
          results.push({
            passed: false,
            input: testCase.input,
            expected: testCase.expected_output,
            actual: null,
            error: result.run.stderr || result.run.output || 'Runtime error',
          })
          allPassed = false
          continue
        }

        // Parse output
        const output = result.run.output.trim()
        let actual: any

        try {
          actual = JSON.parse(output)
        } catch {
          actual = output
        }

        // Compare result
        const passed = deepEqual(actual, testCase.expected_output)
        results.push({
          passed,
          input: testCase.input,
          expected: testCase.expected_output,
          actual,
        })

        if (!passed) allPassed = false
      } catch (error: any) {
        results.push({
          passed: false,
          input: testCase.input,
          expected: testCase.expected_output,
          actual: null,
          error: error.message || 'Execution error',
        })
        allPassed = false
      }
    }

    return {
      success: true,
      results,
      allPassed,
    }
  } catch (error: any) {
    return {
      success: false,
      results: [],
      allPassed: false,
      error: error.message || 'Unknown error',
    }
  }
}

function prepareCodeForExecution(
  userCode: string,
  language: string,
  testCase: any
): string {
  if (language === 'python') {
    // Extract function name from user code
    const match = userCode.match(/def\s+(\w+)\s*\(/)
    const functionName = match ? match[1] : 'solution'

    // Prepare input arguments
    const inputStr = JSON.stringify(testCase.input)

    return `
import json
import sys

${userCode}

# Test execution
try:
    test_input = json.loads('''${inputStr}''')

    # Call function with unpacked arguments
    if isinstance(test_input, dict):
        result = ${functionName}(**test_input)
    elif isinstance(test_input, list):
        result = ${functionName}(*test_input)
    else:
        result = ${functionName}(test_input)

    # Print result as JSON
    print(json.dumps(result, default=str))
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
  }

  return userCode
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (typeof a === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a).sort()
    const keysB = Object.keys(b).sort()
    if (!deepEqual(keysA, keysB)) return false
    for (const key of keysA) {
      if (!deepEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}
