# Minimal Google Play Android Publisher REST client using only Ruby stdlib.
# Avoids fastlane's bundled google-apis gems (which have broken transitive deps
# in this environment). Used by the `tracks` lane to list releases read-only.
require "json"
require "net/http"
require "uri"
require "openssl"
require "base64"

class PlayApi
  HOST = "androidpublisher.googleapis.com".freeze
  SCOPE = "https://www.googleapis.com/auth/androidpublisher".freeze

  def initialize(key_path, package_name)
    @key = JSON.parse(File.read(key_path))
    @pkg = package_name
    @base = "/androidpublisher/v3/applications/#{@pkg}"
  end

  # Yields |track_name, [{status:, version_codes:[], name:}]| for each track.
  def each_track
    edit_id = post("#{@base}/edits")["id"]
    begin
      tracks = get("#{@base}/edits/#{edit_id}/tracks")["tracks"] || []
      tracks.each do |t|
        releases = (t["releases"] || []).map do |r|
          { status: r["status"], version_codes: (r["versionCodes"] || []), name: r["name"] }
        end
        yield t["track"], releases
      end
    ensure
      delete("#{@base}/edits/#{edit_id}") rescue nil
    end
  end

  private

  def token
    @token ||= begin
      now = Time.now.to_i
      enc = ->(s) { Base64.urlsafe_encode64(s).delete("=") }
      header = enc.call({ alg: "RS256", typ: "JWT" }.to_json)
      claim = enc.call({ iss: @key["client_email"], scope: SCOPE,
                         aud: @key["token_uri"], iat: now, exp: now + 3600 }.to_json)
      pk = OpenSSL::PKey::RSA.new(@key["private_key"])
      sig = enc.call(pk.sign(OpenSSL::Digest::SHA256.new, "#{header}.#{claim}"))
      jwt = "#{header}.#{claim}.#{sig}"
      res = Net::HTTP.post_form(URI(@key["token_uri"]),
                                "grant_type" => "urn:ietf:params:oauth:grant-type:jwt-bearer",
                                "assertion" => jwt)
      JSON.parse(res.body).fetch("access_token")
    end
  end

  def http
    Net::HTTP.start(HOST, 443, use_ssl: true)
  end

  def auth_headers
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end

  def get(path)
    JSON.parse(http.get(URI("https://#{HOST}#{path}"), auth_headers).body)
  end

  def post(path, body = "")
    JSON.parse(http.post(URI("https://#{HOST}#{path}"), body, auth_headers).body)
  end

  def delete(path)
    http.delete(URI("https://#{HOST}#{path}"), auth_headers)
  end
end
