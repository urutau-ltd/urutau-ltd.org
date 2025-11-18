#!/usr/bin/env perl
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright © 2024-2025 Urutau-Ltd <softwarelibre@urutau-ltd.org>
#
#   , _ ,      _    _            _                     _ _      _
#  ( o o )    | |  | |          | |                   | | |    | |
# /'` ' `'\   | |  | |_ __ _   _| |_ __ _ _   _ ______| | |_ __| |
# |'''''''|   | |  | | '__| | | | __/ _` | | | |______| | __/ _` |
# |\\'''//|   | |__| | |  | |_| | || (_| | |_| |      | | || (_| |
#    """       \____/|_|   \__,_|\__\__,_|\__,_|      |_|\__\__,_|
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the  GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or (at
# your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
use v5.36;

use warnings;
use utf8;
use open qw(:std :encoding(UTF-8));

use Getopt::Long qw(GetOptionsFromArray);
use Pod::Usage;
use MIME::Base64 qw(encode_base64 decode_base64);
use POSIX qw(strftime);

use Readonly;
Readonly::Scalar my $DEFAULT_ENV_VAR => 'GENMAIL_TARGET';
Readonly::Scalar my $CONTACT_PROMPT => 'Desafío de Contacto';
Readonly::Scalar my $DECODE_PROMPT => 'Prueba de decoding';
Readonly::Scalar my $VERIFY_PROMPT => 'Verificacion exitosa';
Readonly::Scalar my $TIMESTAMP_FORMAT => '%Y-%m-%d %H:%M:%S';

our $VERSION = version->declare('v1.0.0');

exit main(\@ARGV);

#
# Keep all entry-point branching in one place so the CLI can decide which
# code paths to run before touching any I/O-heavy helpers.
sub main ($argv_ref) {
    my $options = parse_options($argv_ref);

    if ($options->{mode} eq 'decode') {
        my $challenge = fetch_challenge($options);
        log_verbose($options->{verbose}, 'Decoding provided challenge.');
        my $decoded_email = decode_challenge($challenge);
        my $normalized = normalize_challenge($challenge);
        output_result($normalized, $decoded_email);
        return 0;
    }

    my $email = fetch_email($options);

    if ($options->{mode} eq 'verify') {
        log_verbose($options->{verbose}, "Verifying challenge against <$email>.");
        my $challenge = fetch_challenge($options);
        my $decoded_email = decode_challenge($challenge);
        my $normalized = normalize_challenge($challenge);

        if ($decoded_email ne $email) {
            die "Challenge decodes to <$decoded_email>, which differs from <$email>.\n";
        }

        my $expected = build_challenge($email);
        if ($expected ne $normalized) {
            die "The supplied challenge does not match the canonical encoding.\n";
        }

        output_result($normalized, $decoded_email, 1);
        return 0;
    }

    log_verbose($options->{verbose}, "Using e-mail <$email> for the challenge.");
    my $challenge = build_challenge($email);

    log_verbose($options->{verbose}, 'Challenge created, performing verification step.');
    my $decoded_email = decode_challenge($challenge);

    if ($decoded_email ne $email) {
        die "Decoded address does not match original input. Aborting.\n";
    }

    output_result($challenge, $decoded_email);
    return 0;
}

#
# Parse options early so the rest of the code works with normalized data and
# does not need to worry about help/version requests sprinkled mid-flow.
sub parse_options ($argv_ref) {
    my %options = (
        env_var => $DEFAULT_ENV_VAR,
        verbose => 0,
    );

    my $help = 0;
    my $man = 0;
    my $version_flag = 0;
    my $decode_flag = 0;
    my $verify_flag = 0;

    GetOptionsFromArray(
        $argv_ref,
        'email=s' => \$options{email},
        'env=s' => \$options{env_var},
        'challenge=s' => \$options{challenge},
        'decode!' => \$decode_flag,
        'verify-challenge!' => \$verify_flag,
        'verbose!' => \$options{verbose},
        'help|?' => \$help,
        'man|longhelp|??' => \$man,
        'version' => \$version_flag,
    ) or pod2usage(2);

    pod2usage(1) if $help;
    pod2usage(-verbose => 2) if $man;

    if ($version_flag) {
        say $VERSION->normal;
        exit 0;
    }

    if ($decode_flag && $verify_flag) {
        pod2usage(
            -exitval => 2,
            -msg     => "--decode and --verify-challenge are mutually exclusive.\n",
        );
    }

    $options{env_var} //= $DEFAULT_ENV_VAR;
    $options{mode} = $decode_flag ? 'decode'
                    : $verify_flag ? 'verify'
                    : 'encode';

    return \%options;
}

#
# Centralize how encoding/verification paths obtain the mailbox so they all
# benefit from a single environment-variable fallback and failure message.
sub fetch_email ($options) {
    if (defined $options->{email} && $options->{email} ne q{}) {
        return $options->{email};
    }

    my $env_var = $options->{env_var};
    my $from_env = $ENV{$env_var};
    if (defined $from_env && $from_env ne q{}) {
        log_verbose($options->{verbose}, "Falling back to \$$env_var environment variable.");
        return $from_env;
    }

    pod2usage(
        -exitval => 2,
        -msg     => "Missing e-mail address. Pass --email or set \$${env_var}.\n",
    );
}

#
# Verification/decoding modes call this helper so the CLI enforces challenge
# presence before attempting base64 operations downstream.
sub fetch_challenge ($options) {
    if (defined $options->{challenge} && $options->{challenge} ne q{}) {
        return $options->{challenge};
    }

    pod2usage(
        -exitval => 2,
        -msg     => "Missing challenge string. Pass --challenge when decoding or verifying.\n",
    );
}

#
# Keep the reversible transformation in one place so encode/verify never drift
# apart and generate mismatched contact strings.
sub build_challenge ($email) {
    my $hex = to_hexadecimal($email);
    my $reversed_hex = reverse $hex;

    return encode_base64($reversed_hex, q{});
}

#
# Decoding is reused by every mode, hence the one-stop validation routine for
# challenge formatting and byte alignment.
sub decode_challenge ($challenge) {
    my $normalized = normalize_challenge($challenge);

    if ($normalized !~ /\A[A-Za-z0-9+\/=]*\z/ms) {
        die "Challenge string contains invalid base64 characters.\n";
    }

    my $reversed_hex = decode_base64($normalized);
    my $hex = reverse $reversed_hex;

    if (length($hex) % 2 != 0) {
        die "Decoded challenge produced an odd-length hexadecimal payload.\n";
    }

    return pack('H*', $hex);
}

#
# Hex serialization is isolated because both directions (encode + verify) have
# to rely on the same low-level primitive.
sub to_hexadecimal ($value) {
    return unpack('H*', $value);
}

# 
# The output helper guarantees that all code paths render the challenge/proof
# consistently, preventing human errors when copying values into the website.
sub output_result ($challenge, $decoded_email, $verified = 0) {
    say "$CONTACT_PROMPT: $challenge";
    say "$DECODE_PROMPT:";
    say $decoded_email;
    say $VERIFY_PROMPT if $verified;
    return;
}

#
# Verbose logging goes through one subroutine so the format stays uniform and
# timestamps remain enforced regardless of the call site.
sub log_verbose ($enabled, $message) {
    return unless $enabled;
    my $timestamp = strftime($TIMESTAMP_FORMAT, localtime);
    say {*STDERR} "[$timestamp] $message";
    return;
}

#
# Normalization is separated so both decoding and verification can depend on
# the exact same whitespace handling policy without duplicating regexes.
sub normalize_challenge ($challenge) {
    return $challenge =~ s/\s+//gr;
}

__END__

=encoding utf8

=head1 NAME

genmail.pl - Generate and verify the Urutau contact challenge string.

=head1 SYNOPSIS

  genmail.pl --email example@email.com
  GENMAIL_TARGET=example@email.com genmail.pl
  GENMAIL_TARGET=example@email.com genmail.pl --verbose
  genmail.pl --decode --challenge 'NzYyN2Y2...'
  genmail.pl --verify-challenge --challenge 'NzYyN2Y2...' --email example@email.com

=head1 DESCRIPTION

This CLI encodes a mailbox into the same challenge format shown on
the contact page: the address is serialized to hexadecimal, the byte order is
reversed, and the result is base64 encoded. The script prints both the
challenge string and a decoding proof so contributors can manually test the
shell command sequence published on the contact page.

By default the script reads the address from the C<GENMAIL_TARGET> environment
variable. You can override the source with C<--email> or point at a different
environment variable with C<--env>. Verbose mode emits timestamped progress
messages without touching the standard output that is meant to be copied into
the website. The new C<--decode> and C<--verify-challenge> switches help audit
previously published strings without having to re-run the shell pipeline.

=head1 OPTIONS

=over 4

=item B<--email>

Explicit e-mail address to encode. Useful when you do not want to rely on
environment variables.

=item B<--env>

Alternative environment variable name that stores the address. Defaults to
C<GENMAIL_TARGET>.

=item B<--challenge>

Challenge string to decode or verify. Required when using C<--decode> or
C<--verify-challenge>.

=item B<--decode>, B<--no-decode>

Switch the CLI into decode mode so it prints the plain e-mail address from the
provided challenge string.

=item B<--verify-challenge>, B<--no-verify-challenge>

Check whether the supplied challenge matches the provided e-mail. The decoded
address and canonical challenge are displayed when the verification succeeds.

=item B<--verbose>, B<--no-verbose>

Enable or disable verbose logging (disabled by default). Logs show up on
standard error so they never corrupt the generated challenge value.

=item B<--version>

Print the script version and exit.

=item B<--help>, B<--man>

Show short usage or the full manual, respectively.

=back

=head1 WORKFLOW

=over 4

=item 1

Provide your contact address through C<--email> or via the environment and run
the script. Keep the generated challenge handy: it is what appears on the
contact page.

=item 2

When you need to inspect an existing entry, call C<--decode> with the stored
string or replicate the documented shell pipeline: C<base64 -d>, C<rev>, and a
C<sed> substitution that turns pairs of hexadecimal digits into C<\xNN> before
using C<printf>.

=item 3

Leverage C<--verify-challenge> to sanity-check page edits: the mode rejects any
inconsistent pair before it lands in Git, ensuring readers can reproduce the
challenge exactly.

=item 4

Publish the canonical challenge in the markdown page without exposing the plain
address; anyone capable of reproducing the steps above will recover it.

=back

=head1 EXIT STATUS

Returns zero on success. Any validation or decoding error aborts with a
non-zero exit code and an explanatory message.

=head1 BUGS

Please report any bugs or issues using the repository's bug tracker.

=head1 AUTHOR

Urutau Limited <softwarelibre@urutau-ltd.org>

=head1 COPYRIGHT AND LICENSE

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

=cut
