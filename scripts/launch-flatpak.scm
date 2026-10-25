#!/usr/bin/env -S guile -s
!#
;;; launch-flatpak.scm --- Launch ungoogled-chromium flatpak with Chrome DevTools Protocol debug port -*- mode: scheme; -*-
;;;
;;; SPDX-License-Identifier: GPL-3.0-or-later
;;; Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>
;;;
;;; Commentary:
;;;
;;; Launches the ungoogled-chromium flatpak with Chrome DevTools Protocol
;;; enabled on port 9222 so the chrome-devtools MCP server configured in
;;; opencode.jsonc can attach to http://127.0.0.1:9222.
;;;
;;; A debug profile lives in /tmp/urutau-debug and is removed once chromium
;;; exits so each launch starts from a clean slate.
;;;
;;; Code:
(define %port 9222)
(define %profile "/tmp/urutau-debug")

(define (port-open? port)
    "Return #t if a Chrome DevTools Protocol endpoint already accepts connections on 127.0.0.1:PORT."
    (let ((sock (socket AF_INET SOCK_STREAM 0)))
        (catch #t
            (lambda ()
                (connect sock AF_INET (inet-pton AF_INET "127.0.0.1") port)
                (close sock)
                #t)
            (lambda (key . args)
                (close sock)
                #f))))

(define (cleanup)
    "Delete the throwaway debug profile."
    (system* "rm" "-rf" %profile))

(define (launch)
    "Run chromium; report spawn failures instead of dying silently."
    (catch #t
        (lambda ()
            (system* "flatpak"
                     "run"
                     "--share=network"
                     "--command=chromium"
                     "io.github.ungoogled_software.ungoogled_chromium"
                     (format #f "--remote-debugging-port=~a" %port)
                     (format #f "--user-data-dir=~a" %profile)))
        (lambda (key . args)
            (format (current-error-port)
                    "Could not launch flatpak (~a). Is flatpak installed?~%" key)
            (exit 1))))

(if (port-open? %port)
    (begin
        (format #t "Chrome DevTools Protocol already listening on 127.0.0.1:~a, skipping launch.~%" %port)
        (exit 0))
    (let ((status (launch)))
        (cleanup)
        (exit status)))
;;; launch-flatpak.scm ends here.
