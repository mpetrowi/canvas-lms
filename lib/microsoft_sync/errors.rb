# frozen_string_literal: true

#
# Copyright (C) 2021 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.
#

# When the sync job fails, we show an error to the user. Because internal error
# messages may not be safe to show to the user, we opt-in to showing the user
# the message for certain errors by making it a PublicError, which provides a
# public_message. This defaults to just the error `message` but can be
# overridden, in case we want to display a different message to users than what
# is in our logs/failed job/etc.
module MicrosoftSync
  module Errors
    def self.user_facing_message(error)
      error_name = error.class.name.underscore.split(%r{[_/]}).map(&:capitalize).join(' ')
      case error
      when MicrosoftSync::Errors::PublicError
        "#{error_name}: #{error.public_message}"
      else
        error_name
      end
    end

    class PublicError < StandardError
      def public_message
        message
      end
    end

    class InvalidRemoteState < PublicError; end

    # Makes public the status code but not anything about the response body.
    # The internal error message has the response body (truncated)
    class InvalidStatusCode < PublicError
      attr_reader :public_message

      def initialize(service:, response:, tenant:)
        @public_message = "#{service.capitalize} service returned #{response.code} for tenant #{tenant}"
        super("#{@public_message}, full body: #{response.body.inspect.truncate(1000)}")
      end
    end
  end
end
