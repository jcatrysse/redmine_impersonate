require File.expand_path('../../test_helper', __FILE__)

class WarningOverrideTest < ActiveSupport::TestCase
  def capture_stderr
    old = $stderr
    $stderr = StringIO.new
    yield
    $stderr.string
  ensure
    $stderr = old
  end

  test "warn with a category keyword is passed on" do
    out = capture_stderr { Warning.warn("categorized\n", category: :deprecated) }
    assert_equal "categorized\n", out
  end

  test "kernel warn with a category keyword does not raise" do
    assert_nothing_raised do
      capture_stderr { warn("categorized", category: :deprecated) }
    end
  end

  test "filtered pg coder warning is still dropped" do
    out = capture_stderr { Warning.warn("PG::Coder.new(hash) is deprecated\n") }
    assert_equal "", out
  end
end
