# Suppress noisy deprecation warnings emitted by Redmine and dependencies
module Warning
  class << self
    alias_method :original_warn, :warn

    def warn(message, *args)
      return if message.to_s.include?("PG::Coder.new(hash) is deprecated")
      original_warn(message, *args)
    end
  end
end

# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')

# Required for certain Redmine helpers in Ruby 3
require 'ostruct'

# Avoid deprecation noise during test runs
ActiveSupport::Deprecation.behavior = :silence

# Required for certain Redmine helpers in Ruby 3
require 'ostruct'
