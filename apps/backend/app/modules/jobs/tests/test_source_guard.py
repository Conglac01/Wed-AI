"""Tests for source_guard — captcha / anti-bot detection."""

from __future__ import annotations

import pytest

from app.modules.jobs.source_guard import is_blocked_response


class TestIsBlockedResponseCaptcha:
    def test_detects_hcaptcha(self):
        html = "<html><body><div class='h-captcha' data-sitekey='abc'></div></body></html>"
        assert is_blocked_response(html) is True

    def test_detects_robot_text(self):
        html = '<html><title>Xác nhận bạn không phải robot</title></html>'
        assert is_blocked_response(html) is True

    def test_case_insensitive(self):
        html = "<html><body><script src='https://js.HCAPTCHA.com/1/api.js'></script></body></html>"
        assert is_blocked_response(html) is True

    def test_detects_captcha_word(self):
        html = "<html><body><p>Please complete the captcha</p></body></html>"
        assert is_blocked_response(html) is True

    def test_detects_khong_phai_robot(self):
        html = "<div>Chúng tôi nhận thấy có điều bất thường. Hãy xác nhận bạn không phải robot để tiếp tục.</div>"
        assert is_blocked_response(html) is True


class TestIsBlockedResponseClean:
    def test_clean_page_returns_false(self):
        html = "<html><head><title>Việc Làm CNTT Lương Cao</title></head><body><a class='job-link'>Job 1</a></body></html>"
        assert is_blocked_response(html) is False

    def test_empty_string_returns_false(self):
        assert is_blocked_response("") is False

    def test_none_returns_false(self):
        assert is_blocked_response(None) is False

    def test_whitespace_only_returns_false(self):
        assert is_blocked_response("   \n  \t  ") is False

    def test_normal_job_detail_page(self):
        html = """<!DOCTYPE html>
<html>
<head><title>KỸ SƯ EMBEDDED - CÔNG TY TECOTEC</title></head>
<body>
<script type="application/ld+json">{"@type":"JobPosting","title":"Kỹ sư Embedded"}</script>
<div class="job-benefit-item">Bảo hiểm</div>
<a class="job-link" href="/tim-viec-lam/ky-su-embedded/123">Chi tiết</a>
</body>
</html>"""
        assert is_blocked_response(html) is False
